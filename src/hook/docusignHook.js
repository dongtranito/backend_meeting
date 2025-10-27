import { db } from "../config/firebaseService.js";
import { uploadToS3 } from "../config/s3Service.js";
import dotenv from "dotenv";

import * as docusignService from "../services/docusignService.js";

dotenv.config();

export async function handleDocuSignWebhook(req, res) {
    try {

        const body = req.body;
        console.log("đã có hook gọi")
        console.log(body)
        if (body.event !== "envelope-completed") {
            return res.status(200).json({ message: "Không xử lý event này." });
        }

        const envelopeId = body.data?.envelopeId;
        if (!envelopeId) throw new Error("Thiếu envelopeId trong webhook.");

        console.log("Nhận webhook hoàn thành ký:", envelopeId);

        const pdfBuffer = await docusignService.downloadSignedPDF(envelopeId);

        const fileName = `signed_${envelopeId}.pdf`;
        const { url } = await uploadToS3({
            folder: "signMinute",
            fileName,
            fileBuffer: pdfBuffer,
            contentType: "application/pdf",
        });

        console.log("✅ Upload file ký xong lên S3:", url);

        const meetingRef = db
            .collection("meetings")
            .where("minutes.envelopeId", "==", envelopeId);
        const meetingSnap = await meetingRef.get();

        if (meetingSnap.empty) {
            console.warn("⚠️ Không tìm thấy meeting có envelopeId:", envelopeId);
        } else {
            for (const doc of meetingSnap.docs) {
                await doc.ref.update({
                    "minutes.signedMinute": url, 
                    status: "signed",          
                });

                console.log(`🔥 Đã cập nhật meeting ${doc.id}`);
            }
        }

        res.status(200).json({ success: true, message: "Webhook xử lý xong." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
