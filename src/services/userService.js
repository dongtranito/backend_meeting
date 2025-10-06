import fs from "fs";
import { parseFile } from "music-metadata";
import { db } from "./firebaseService.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadSampleVoice(email, file) {
  const fileNameOnS3 = `user_samples/${email}.wav`;
  const fileBuffer = fs.readFileSync(file.path);

  try {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileNameOnS3,
      Body: fileBuffer,
      ContentType: file.mimetype,
    })
  );

  const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileNameOnS3}`;

  const userRef = db.collection("users").doc(email);
  await userRef.set(
    { sampleVoice: fileUrl, updatedAt: new Date() },
    { merge: true }
  );


  return {
    url: fileUrl,
  };
  } finally {
   await  fs.promises.unlink(file.path);
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
    updatedAt: data.updatedAt || null,
  };
}
