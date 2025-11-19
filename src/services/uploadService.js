import { db, admin } from "../config/firebaseService.js";
import fs from "fs";
import { uploadToS3, deleteFromS3 } from "../config/s3Service.js";

export async function uploadRecord(userId, meetingId, file) {
    try {
        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp để upload record");
        }

        const meetingData = meetingDoc.data();
        if (meetingData.owner_id !== userId) {
            throw new Error("Chỉ chủ cuộc họp mới được phép upload record");
        }
        if (meetingData.status && meetingData.status === "signed") {
            throw new Error("Cuộc họp đã được ký, không thể upload record");
        }
        if (meetingData.minutes?.officeMinute) {
            throw new Error("Cuộc họp đã tạo biên bản nên không thể upload record");
        }

        const buffer = fs.readFileSync(file.path);
        const { url } = await uploadToS3({
            folder: "record",
            fileName: `${file.originalname}${meetingId}.mp3`,
            fileBuffer: buffer,
            contentType: file.mimetype,
        });

        await meetingRef.update({
            audio_url: url,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            meetingId,
            url,
        };
    } catch (error) {
        throw new Error(error.message || "Không thể upload được record");
    }
}

export async function uploadSampleMinute(userId, meetingId, url) {
    try {
        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp để upload biên bản mẫu");
        }

        const meetingData = meetingDoc.data();
        if (meetingData.owner_id !== userId) {
            throw new Error("Chỉ chủ cuộc họp mới được phép upload biên bản mẫu");
        }

        if (meetingData.status && meetingData.status === "signed") {
            throw new Error("Cuộc họp đã được ký, không thể upload biên bản mẫu nữa");
        }
        
        await meetingRef.update({
            "minutes.sampleMinute": url,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            meetingId,
            url,
        }
    } catch (error) {
        throw new Error(error.message || "Không thể upload được biên bản mẫu");
    }
}
export async function uploadOfficeMinute(userId, meetingId, url) {
    try {
        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp để upload biên bản");
        }

        const meetingData = meetingDoc.data();
        if (meetingData.owner_id !== userId) {
            throw new Error("Chỉ chủ cuộc họp mới được phép upload biên bản");
        }
        await meetingRef.update({
            "minutes.officialMinute": url,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            meetingId,
            url,
        }
    } catch (error) {
        throw new Error(error.message || "Không thể upload được biên bản chính thức");
    }
}