import fs from "fs";
import { parseFile } from "music-metadata";
import { db } from "../config/firebaseService.js";
import { uploadToS3, deleteFromS3 } from "../config/s3Service.js";
import dotenv from "dotenv";

dotenv.config();

export async function createSampleVoice(email, file) {
  try {
    const fileNameOnS3 = `${email}.wav`;
    const fileBuffer = fs.readFileSync(file.path);
    // const { url } = await uploadToS3("sample_voice", fileNameOnS3, fileBuffer, file.mimetype)
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
