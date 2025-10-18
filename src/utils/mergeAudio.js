import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import os from "os";
import path from "path";
import axios from 'axios';
import { db, admin } from "../config/firebaseService.js";
import { parseFile } from 'music-metadata';
import { uploadToS3 } from '../config/s3Service.js';
ffmpeg.setFfmpegPath(ffmpegPath);

export async function mergeGroupVoicesUtil(groupId) {
  const groupRef = db.collection("groups").doc(groupId);

  let memberVoices = [];
  const tmpRoot = os.tmpdir(); // 📂 thư mục tạm của hệ thống, luôn có
  const tmpDir = path.join(tmpRoot, `group_${groupId}`);
  const concatFile = path.join(tmpDir, "concat.txt");
  const outputFile = path.join(tmpDir, `merged_group_${groupId}.mp3`);


  try {
    // 🔹 Tạo thư mục tạm (nếu chưa có)
    fs.mkdirSync(tmpDir, { recursive: true });

    // 1️⃣ Lấy danh sách member
    const membersSnapshot = await groupRef.collection("members").get();
    if (membersSnapshot.empty) {
      throw new Error("Group chưa có thành viên nào");
    }

    // 2️⃣ Lấy sampleVoice từ tất cả user trong group
    for (const doc of membersSnapshot.docs) {
      const userId = doc.id;
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userData?.sampleVoice) {
        memberVoices.push({
          id: userId,
          name: doc.data().name || "Unknown",
          url: userData.sampleVoice,
        });
      }
    }

    if (memberVoices.length === 0) {
      throw new Error("Không có thành viên nào có sampleVoice");
    }

    console.log(`🎧 Đang tải ${memberVoices.length} file voice...`);

    // 3️⃣ Download song song toàn bộ file audio
    await Promise.all(memberVoices.map(async (v, i) => {
      const res = await axios({ url: v.url, responseType: "arraybuffer" });
      const filePath = `${tmpDir}/voice_${i + 1}.mp3`;
      fs.writeFileSync(filePath, Buffer.from(res.data));
      v.file = filePath;
    }));

    // 4️⃣ Tạo file concat list cho ffmpeg
    const concatList = memberVoices
      .map(v => `file '${path.resolve(v.file)}'`)  // dùng absolute path
      .join('\n')
      
    fs.writeFileSync(concatFile, concatList);

    console.log(`🔄 Bắt đầu merge bằng ffmpeg...`);
    // 👇 Thêm chỗ này
    console.log("📄 Checking concat.txt path:", concatFile);
    console.log("📦 Exists?", fs.existsSync(concatFile));
    if (fs.existsSync(concatFile)) {
      console.log("📜 Content:\n", fs.readFileSync(concatFile, "utf-8"));
    } else {
      console.log("🚨 concat.txt NOT FOUND — check your tmpDir path or file write!");
    }
    // 5️⃣ Merge audio files
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-acodec copy'])
        .save(outputFile)
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`✅ Merge hoàn tất: ${outputFile}`);

    // 6️⃣ Lấy metadata để tính tổng thời lượng
    const metadata = await parseFile(outputFile);
    const totalTime = metadata.format.duration; // giây

    // 7️⃣ Upload lên S3
    const fileBuffer = fs.readFileSync(outputFile);
    const uploadResult = await uploadToS3({
      folder: "groupSampleVoice",
      fileName: `${groupId}_merged.mp3`,
      fileBuffer,
      contentType: "audio/mpeg",
    });

    // 8️⃣ Map speaker
    const speakerMap = memberVoices.map((v, index) => ({
      speaker: `Speaker ${index + 1}`,
      name: v.name,
    }));

    // 9️⃣ Update Firestore
    await groupRef.set({
      mergedVoice: {
        url: uploadResult.url,
        speakerMap,
        totalTime,
        createdAt: new Date().toISOString(),
      },
    }, { merge: true });

    console.log(`📤 Upload thành công lên S3`);
    console.log(`🧾 URL: ${uploadResult.url}`);
    console.log(`🕒 Tổng thời lượng: ${totalTime.toFixed(2)} giây`);

    // ✅ Return kết quả
    return {
      mergedUrl: uploadResult.url,
      totalTime,
      speakerMap,
    };

  } catch (error) {
    console.error("❌ Lỗi khi merge voice:", error.message);
    throw error;

  } finally {
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
      memberVoices.forEach(v => v.file && fs.existsSync(v.file) && fs.unlinkSync(v.file));
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true });
      console.log("🧹 Đã dọn sạch file tạm");
    } catch (cleanupErr) {
      console.warn("⚠️ Lỗi khi cleanup:", cleanupErr.message);
    }
  }
}

