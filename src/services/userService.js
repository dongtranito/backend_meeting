import fs from "fs";
import { parseFile } from "music-metadata";
import { db } from "../config/firebaseService.js";
import { uploadToS3, deleteFromS3 } from "../config/s3Service.js";
import dotenv from "dotenv";
import { mergeGroupVoicesUtil } from "../utils/mergeAudio.js";

dotenv.config();

export async function createSampleVoice(email, file) {
  try {
    const fileNameOnS3 = `${email}.wav`;
    const fileBuffer = fs.readFileSync(file.path);
    const { url } = await uploadToS3({
      folder: "sample_voice",
      fileName: fileNameOnS3,
      fileBuffer: fileBuffer,
      contentType: file.mimetype,
    });
    const userRef = db.collection("users").doc(email);
    await userRef.set(
      {
        sampleVoice: url,
        updatedAt: new Date()
      },
      { merge: true }
    );

    const groupsSnapshot = await db.collection("groups").get();
    const affectedGroups = [];

    for (const groupDoc of groupsSnapshot.docs) {
      const memberRef = groupDoc.ref.collection("members").doc(email);
      const memberDoc = await memberRef.get();
      if (memberDoc.exists) {
        affectedGroups.push(groupDoc.id);
      }
    }

    if (affectedGroups.length === 0) {
      console.log(`ℹ️ User ${email} không nằm trong group nào => không cần merge lại`);
    } else {
      console.log(`🎧 User ${email} nằm trong ${affectedGroups.length} group(s):`, affectedGroups);

      affectedGroups.forEach(groupId => {
        Promise.resolve(mergeGroupVoicesUtil(groupId))
          .then(() => console.log(`✅ Re-merged voice cho group ${groupId}`))
          .catch(err => console.error(`❌ Merge lại group ${groupId} lỗi:`, err.message));
      });
    }
    return {
      message: "upload thành công voice lên s3",
      url
    };
  } finally {
    await fs.promises.unlink(file.path);
  }
}


export async function getSampleVoice(email) {
  const userRef = db.collection("users").doc(email);
  const doc = await userRef.get();

  if (!doc.exists) {
    throw new Error("User not found");
  }

  const data = doc.data();
  if (!data.sampleVoice) {
    throw new Error("User chưa có sample voice");
  }

  return {
    email,
    sampleVoice: data.sampleVoice,
    updatedAt: data.updatedAt.toDate().toISOString() || null,
  };
}
