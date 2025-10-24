import fs from "fs";
import { uploadToS3, deleteFromS3 } from "../config/s3Service.js";
import { parseFile } from "music-metadata";
import { extractPlaceholdersWithDocx } from "../utils/generateMinute.js";
import * as uploadService from "../services/uploadService.js";

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
        const { meetingId } = req.body;
        const userId = req.email;
        if (!file) {
            return res.status(400).json({ success: false, error: "Chưa có file audio" });
        }
        if (!meetingId) {
            return res.status(400).json({ success: false, error: "thiếu meetingId" });
        }
        if (!file.mimetype.startsWith("audio/")) {
            await fs.promises.unlink(file.path);
            return res.status(400).json({ success: false, error: "File phải là dạng audio" });
        }
        // const metadata = await parseFile(file.path);
        // const duration = metadata.format.duration || 0;
        const buffer = fs.readFileSync(file.path);

        const { url } = await uploadToS3({
            folder: "record",
            fileName: `${file.originalname}${meetingId}`,
            fileBuffer: buffer,
            contentType: file.mimetype,
        });
        const result = await uploadService.uploadRecord(userId,meetingId,url)
        fs.promises.unlink(file.path);
        return res.status(200).json({
            success: true,
            message: "Upload record thành công",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Lỗi server khi upload record",
        });
    }
}
export async function uploadSampleMinute(req, res) {
    try {
        const file = req.file;
        const { meetingId } = req.body;
        const userId = req.email;
        if (!file) {
            return res.status(400).json({ success: false, error: "Chưa có file DOCX" });
        }
        if (!meetingId) {
            return res.status(400).json({ success: false, error: "thiếu meetingId" });
        }

        // ✅ Kiểm tra MIME type cho docx
        if (
            file.mimetype !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            await fs.promises.unlink(file.path);
            return res.status(400).json({ success: false, error: "File phải là định dạng DOCX" });
        }

        // Khúc này là check thử file có hợp lệ không 
        const buffer = fs.readFileSync(file.path);
        try {
            await extractPlaceholdersWithDocx(buffer);
        } catch (err) {
            await fs.promises.unlink(file.path);
            return res.status(400).json({
                success: false,
                error: err.message,
            });
        }

        // Khúc này là upload lên s3
        const { url } = await uploadToS3({
            folder: "sampleMinute",
            fileName: `${file.originalname}${meetingId}`,
            fileBuffer: buffer,
            contentType: file.mimetype,
        });

        const result =await uploadService.uploadSampleMinute(userId,meetingId, url);

        // Xóa file tạm sau khi upload xong
        fs.promises.unlink(file.path);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Lỗi server khi upload biên bản DOCX",
        });
    }
}
