import fs from "fs";
import { uploadToS3, deleteFromS3 } from "../config/s3Service.js";
import { parseFile } from "music-metadata";

// import { extractTextFromPdf } from "../utils/pdfParser.js";

// export async function uploadSampleVoice(req, res) {
//   try {
//     const email = req.email; 
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ success: false, error: "Chưa có file audio" });
//     }

//     if (!file.mimetype.startsWith("audio/")) {
//       await fs.promises.unlink(file.path);
//       return res.status(400).json({ success: false, error: "File phải là audio" });
//     }

//     // Đọc file buffer
//     const buffer = fs.readFileSync(file.path);

//     // Upload lên S3
//     const { url } = await uploadToS3({
//       folder: "sample_voice",
//       fileName: `${email}.wav`,
//       fileBuffer: buffer,
//       contentType: file.mimetype,
//     });

//     // Xoá file tạm
//     await fs.promises.unlink(file.path);

//     return res.status(200).json({
//       success: true,
//       data: { url },
//     });

//   } catch (error) {
//     console.error("Upload sample voice error:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "Lỗi server khi upload audio",
//     });
//   }
// }

export async function uploadMetadata(req, res) {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: "Chưa có file PDF" });
        }

        if (!file.mimetype.includes("pdf")) {
            await fs.promises.unlink(file.path);
            return res.status(400).json({ success: false, error: "File phải là PDF" });
        }

        // let text = "";
        // try {
        //     text = await extractTextFromPdf(file.path);
        // } catch (e) {
        //     console.warn("Không đọc được nội dung PDF:", e.message);
        // }

        const buffer = fs.readFileSync(file.path);
        const { url } = await uploadToS3({
            folder: "metadata",
            fileName: file.originalname,
            fileBuffer: buffer,
            contentType: file.mimetype,
        });

        await fs.promises.unlink(file.path);

        return res.status(200).json({
            success: true,
            data: {
                url,
                // text: text.slice(0, 200) + "...",
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Lỗi server khi upload metadata",
        });
    }
}

export async function uploadRecord(req, res) {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: "Chưa có file audio" });
        }

        if (!file.mimetype.startsWith("audio/")) {
            await fs.promises.unlink(file.path);
            return res.status(400).json({ success: false, error: "File phải là dạng audio" });
        }
        const metadata = await parseFile(file.path);
        const duration = metadata.format.duration || 0;
        const buffer = fs.readFileSync(file.path);

        const { url } = await uploadToS3({
            folder: "record",
            fileName: file.originalname,
            fileBuffer: buffer,
            contentType: file.mimetype,
        });
        await fs.promises.unlink(file.path);
        return res.status(200).json({
            success: true,
            message: "Upload record thành công",
            data: {
                url,
                name: file.originalname,
                duration: Number(duration.toFixed(0)),
                type: file.mimetype,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Lỗi server khi upload record",
        });
    }
}
// export async function deleteFile(req, res) {
//   try {
//     const { folder, fileName } = req.body;

//     if (!folder || !fileName) {
//       return res.status(400).json({
//         success: false,
//         error: "Thiếu folder hoặc fileName",
//       });
//     }

//     await deleteFromS3(folder, fileName);

//     return res.status(200).json({
//       success: true,
//       message: "Xoá file khỏi S3 thành công",
//     });
//   } catch (error) {
//     console.error("Delete file error:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message || "Lỗi server khi xoá file",
//     });
//   }
// }
