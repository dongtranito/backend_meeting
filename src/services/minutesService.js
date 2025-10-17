import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🧠 Hàm chính: Tạo transcript + đợi Azure xử lý + lấy kết quả thật
 */
export async function createTranscript(audioUrl) {
  const {
    AZURE_SPEECH_KEY,
    AZURE_SPEECH_ENDPOINT,
    AZURE_SPEECH_MODEL,
  } = process.env;

  // 1️⃣ Chuẩn bị payload
  const payload = {
    displayName: `transcript_${Date.now()}`,
    description: "Speech Studio Batch speech to text",
    locale: "vi-VN",
    contentUrls: [audioUrl],
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
  console.log("🪄 Azure job created:", transcriptUrl);

  // 3️⃣ Poll trạng thái job
  let status = "NotStarted";
  const maxAttempts = 30; // tối đa 30 lần (mỗi lần 10s => 5 phút)
  let attempt = 0;

  while (attempt < maxAttempts && status !== "Succeeded" && status !== "Failed") {
    await new Promise((r) => setTimeout(r, 10000)); // đợi 10s
    attempt++;

    const statusRes = await axios.get(transcriptUrl, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY },
    });

    status = statusRes.data.status;
    console.log(`⏳ Attempt ${attempt}: Status = ${status}`);

    // 4️⃣ Khi job đã xong
    if (status === "Succeeded") {
      const fileListUrl = statusRes.data.links.files;
      const filesRes = await axios.get(fileListUrl, {
        headers: { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY },
      });

      console.log("🧾 File list from Azure:", JSON.stringify(filesRes.data, null, 2));

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
      const segments = extractTranscriptSegments(transcriptRes.data);
      const text = segments.map(
        (s) => `[${s.speaker} ${s.start}] ${s.text}`
      ).join("\n");

      return {
        status: "Succeeded",
        transcriptUrl,
        text,        // đoạn text đầy đủ kiểu Azure
        segments,    // danh sách segment để hiển thị linh hoạt
      };
    }
  }

  // 6️⃣ Nếu Azure chưa xong
  return {
    status,
    transcriptUrl,
    text: null,
    message:
      status === "Failed"
        ? "Azure xử lý thất bại"
        : "Quá thời gian chờ, transcript chưa hoàn tất",
  };
}

/**
 * 🧩 Helper: Convert ticks -> thời gian + speaker + text
 */
function extractTranscriptSegments(jsonData) {
  if (!jsonData.recognizedPhrases) return [];

  const ticksToSeconds = (ticks) => ticks / 10_000_000; // Azure: 1 tick = 100ns
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const segments = jsonData.recognizedPhrases.map((p) => {
    const startSec = ticksToSeconds(p.offsetInTicks || 0);
    const time = formatTime(startSec);
    const text = p.nBest?.[0]?.display || "";
    return {
      speaker: `Speaker ${p.speaker || 1}`,
      start: time,
      text,
    };
  });

  return segments;
}
