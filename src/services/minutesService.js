import axios from "axios";
import dotenv from "dotenv";
import { mergeGroupAndAudio } from "../utils/mergeAudio.js"
import { db, admin } from "../config/firebaseService.js";
import { deleteFromS3 } from "../config/s3Service.js"
import { generateMinute, loadDocxBufferFromUrl, renderDocx } from "../utils/generateMinute.js"
import {uploadToS3} from "../config/s3Service.js"
dotenv.config();

export async function createTranscript(userId, meetingId, audioUrl) {
  const {
    AZURE_SPEECH_KEY,
    AZURE_SPEECH_ENDPOINT,
    AZURE_SPEECH_MODEL,
  } = process.env;
  const meetingRef = db.collection("meetings").doc(meetingId);
  const meetingDoc = await meetingRef.get();

  if (!meetingDoc.exists) {
    throw new Error("Không tồn tại meeting");
  }

  const meetingData = meetingDoc.data();

  if (meetingData.owner_id !== userId) {
    throw new Error("Chỉ chủ cuộc họp mới có quyền tạo transcript");
  }
  const groupId = meetingData.group_id;

  const {
    url,
    speakerMap,
    totalTime
  } = await mergeGroupAndAudio(groupId, audioUrl);

  // 1️⃣ Chuẩn bị payload
  const payload = {
    displayName: `transcript_${Date.now()}`,
    description: "Speech Studio Batch speech to text",
    locale: "vi-VN",
    contentUrls: [url],
    model: { self: AZURE_SPEECH_MODEL },
    properties: {
      diarizationEnabled: true,
      diarization: { speakers: { minCount: 1, maxCount: 6 } },
      punctuationMode: "DictatedAndAutomatic",
      profanityFilterMode: "None",
    },
  };

  // 2️⃣ Gửi request tạo job transcript
  const createRes = await axios.post(AZURE_SPEECH_ENDPOINT, payload, {
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
      "Content-Type": "application/json",
    },
  });

  const transcriptUrl = createRes.data.self;
  // console.log("🪄 Azure job created:", transcriptUrl);

  // 3️⃣ Poll trạng thái job
  let status = "NotStarted";
  const maxAttempts = 200; // tối đa 200 lần (mỗi lần 5s => 1000s)
  let attempt = 0;

  while (attempt < maxAttempts && status !== "Succeeded" && status !== "Failed") {
    await new Promise((r) => setTimeout(r, 5000)); // đợi 5
    attempt++;

    const statusRes = await axios.get(transcriptUrl, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY },
    });

    status = statusRes.data.status;
    // console.log(`⏳ Attempt ${attempt}: Status = ${status}`);

    // 4️⃣ Khi job đã xong
    if (status === "Succeeded") {
      const fileListUrl = statusRes.data.links.files;
      const filesRes = await axios.get(fileListUrl, {
        headers: { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY },
      });

      // console.log("fileRes", JSON.stringify(filesRes.data, null, 2));

      // ✅ Tìm file transcript thật
      const transcriptionFile = filesRes.data.values.find((f) => {
        const name = f.name.toLowerCase();
        return (
          (name.includes("contenturl") ||
            name.includes("transcription") ||
            f.kind === "Transcription") &&
          f.links?.contentUrl
        );
      });

      if (!transcriptionFile) {
        throw new Error("Không tìm thấy file transcript");
      }


      // 5️⃣ Lấy nội dung file transcript
      const transcriptRes = await axios.get(transcriptionFile.links.contentUrl);
      const segments = extractTranscriptSegments(transcriptRes.data, speakerMap, totalTime);
      const text = segments.map(
        (s) => `[${s.speaker} ${s.start}] ${s.text}`
      ).join("\n");
      deleteFromS3(url);
      await meetingRef.update({
        transcript: {
          text,
          segments,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {
        text,        // đoạn text đầy đủ kiểu Azure
        segments,    // danh sách segment để hiển thị linh hoạt
      };
    }
  }

  throw new Error("không tạo được transcript");
}

function extractTranscriptSegments(jsonData, speakerMap, totalTime) {
  if (!jsonData.recognizedPhrases) return [];

  const ticksToSeconds = (ticks) => ticks / 10_000_000; // Azure: 1 tick = 100ns
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const segments = jsonData.recognizedPhrases
    .filter(p => ticksToSeconds(p.offsetInTicks || 0) >= totalTime)
    .map((p) => {
      const startSec = ticksToSeconds(p.offsetInTicks || 0);
      const time = formatTime(startSec);
      const text = p.nBest?.[0]?.display || "";
      const found = speakerMap.find((m) => m.id === p.speaker);
      return {
        start: time,
        text,
        speaker: found ? found.name : `unknow, Speaker ${p.speaker || 0}`,
      };
    })
  return segments;
}

export async function createMinute(userId, meetingId, audioUrl) {
  try {
    const meetingRef = db.collection("meetings").doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error("Không tồn tại meeting");
    }

    const meetingData = meetingDoc.data();

    if (meetingData.owner_id !== userId) {
      throw new Error("Chỉ chủ cuộc họp mới có quyền tạo transcript");
    }
    if (!meetingData.minutes?.sampleMinute) {
      throw new Error("Chưa có biên bản mẫu");
    }
    const transcript = await createTranscript(userId, meetingId, audioUrl);  //trả về {text, segments} text là transcript á
    const data = {
      urlSampleMinute: meetingData.minutes.sampleMinute,
      title: meetingData.title || "",
      description: meetingData.description || "",
      scheduledAt: meetingData.scheduledAt.toDate().toISOString() || "",
      transcriptText: transcript.text || "",
      metaData: meetingData.meta_data || {},
    };
    const result = await generateMinute(data);
    await meetingRef.update({
      "minutes.officeMinute": result.url,
      "minutes.placeholder": result.aiResult,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return result
  } catch (error) {
    throw new Error(error.message || "Không tạo được biên bản");
  }
}

export async function getMinute(userId, meetingId) {
  try {
    const meetingRef = db.collection("meetings").doc(meetingId);
    const meetingDoc = await meetingRef.get();
    if (!meetingDoc.exists) {
      throw new Error("Không tồn tại cuộc họp");
    }
    const meetingData = meetingDoc.data();
    const groupId = meetingData.group_id;
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new Error("Không tồn tại group");
    }

    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      throw new Error("User không thuộc group này, không có quyền xem biên bản");
    }
    const minute = meetingData.minutes;
    return minute
  } catch (error) {
    throw new Error(error.message || "Lỗi khi lấy biên bản");
  }
}
export async function updateMinute(userId, meetingId, placeholder) {
  try {
    const meetingRef = db.collection("meetings").doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      throw new Error("Không tồn tại cuộc họp");
    }

    const meetingData = meetingDoc.data();
    if (meetingData.owner_id !== userId) {
      throw new Error("Chỉ chủ cuộc họp mới được phép sửa minute");
    }
    const buffer = await loadDocxBufferFromUrl(meetingData.minutes.sampleMinute);
    const outputBuffer = await renderDocx(buffer, placeholder);
    const fileName = `minute_updated_${Date.now()}.docx`;
    const { url } = await uploadToS3({
      folder: "officeMinute",
      fileName,
      fileBuffer: outputBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await meetingRef.update({
      "minutes.officeMinute": url,
      "minutes.placeholder": placeholder,  // chỗ này là lấy cái placehoder kiểu {ngay: 20, thang: 2} đưa hết vào ghi đè luôn 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
      success: true,
      newUrl: url,
    };
  } catch (error) {
    throw new Error(error.message || "Lỗi khi cập nhật biên bản");
  }
}
