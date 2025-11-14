import { db } from "../config/firebaseService.js";
import { deleteByMeetingId, addDocument } from "../config/chromaService.js";


// cái này là để chạy test tạo  lại vector database cho đồng bộ 
export async function cronJobChromaDB() {
    try {
        const meetingsSnap = await db.collection("meetings").get();
        const meetings = meetingsSnap.docs;
        console.log(`📌 Tổng số cuộc họp cần xử lý: ${meetings.length}`);
        for (const doc of meetings) {
            const meetingId = doc.id;
            const meetingData = doc.data();

            if (!meetingData.transcript || !meetingData.transcript.segments) {
                console.log(`⚠️ Meeting ${meetingId} không có transcript. Bỏ qua.`);
                continue;
            }

            const transcript = meetingData.transcript;

            // Tạo segments dạng text
            const segments = transcript.segments.map(
                (s) => `[${s.speaker}] ${s.text}`
            );

            const groupId = meetingData.group_id;

            console.log(`🔄 Xử lý meeting: ${meetingId} (group: ${groupId})`);

            // Xóa vector cũ
            await deleteByMeetingId(meetingId);
            console.log(`🗑️  Đã xóa vector cũ của meeting ${meetingId}`);

            // Tạo vector mới
            await addDocument(segments, groupId, meetingId);
            console.log(`📥 Đã thêm vector mới cho meeting ${meetingId}`);
        }

        console.log("✅ Hoàn thành rebuild vector database!");

    } catch (error) {
        console.error("❌ Lỗi khi chạy cronjob rebuild vector:", error);
    }
}
