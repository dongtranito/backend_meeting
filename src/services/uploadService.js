import { db, admin } from "../config/firebaseService.js";

export async function uploadRecord(userId, meetingId, url) {
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
        await meetingRef.update({
            "minutes.sampleMinutes": url,
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
            "minutes.officialMinutes": url,
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