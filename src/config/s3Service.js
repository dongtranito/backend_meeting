import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//forder ở đây có 4 loại. sampleVoice, metadata, record, groupSampleVoice
export async function uploadToS3({ folder, fileName, fileBuffer, contentType }) {
  if (!folder || !fileName) throw new Error("Thiếu folder hoặc fileName");

  const key = `${folder}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}

// Helper: delete

export async function deleteFromS3(fileUrl) {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;

    // 🧩 Tách phần key sau ".amazonaws.com/"
    const key = fileUrl.split(".amazonaws.com/")[1];
    if (!key) throw new Error("Không thể trích xuất key từ URL");

    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
  } catch (err) {
    throw err;
  }
}
