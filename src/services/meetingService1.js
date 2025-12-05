import { db, admin } from '../config/firebaseService.js';
import {deleteByMeetingId} from '../config/chromaService.js'
export async function getListMeeting(userId, groupId) {
    try {

        const groupRef = db.collection("groups").doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            throw new Error("Không tồn tại group");
        }

        const memberRef = groupRef.collection("members").doc(userId);
        const memberDoc = await memberRef.get();
        if (!memberDoc.exists) {
            throw new Error("User không thuộc group này, không có quyền xem danh sách cuộc họp");
        }


        const meetingsRef = db.collection("meetings");
        const snapshotMeeting = await meetingsRef
            .where("group_id", "==", groupId)
            .orderBy("createdAt", "desc")
            .get();
        if (snapshotMeeting.empty) {
            return [];
        }

        const meetings = snapshotMeeting.docs.map(doc => ({
            meetingId: doc.id,
            ...doc.data(),
            scheduledAt: doc.data().scheduledAt.toDate().toISOString(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
            updatedAt: doc.data().updatedAt.toDate().toISOString(),
        }));
        return meetings;

    } catch (error) {
        throw error;
    }
}


export async function createMeeting(userId, groupId, meetingData) {
    try {
        const groupRef = db.collection("groups").doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            throw new Error("Không tồn tại group");
        }

        const group = groupDoc.data();
        if (group.owner_id !== userId) {
            throw new Error("Chỉ owner của group mới được phép tạo cuộc họp");
        }
        let scheduledAt = null;

        if (meetingData.scheduledAt) {
            // Ví dụ meetingData.scheduledAt = "2025-10-20T14:00:00"
            const dateObj = new Date(meetingData.scheduledAt);
            if (isNaN(dateObj.getTime())) {
                throw new Error("Thời gian họp không hợp lệ");
            }
            scheduledAt = admin.firestore.Timestamp.fromDate(dateObj);
        }

        const meetingRef = db.collection("meetings").doc();
        const newMeetingData = {
            title: meetingData.title,
            description: meetingData.description || "",
            group_id: groupId,
            owner_id: userId,
            status: "disactive",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            audio_url: meetingData.audioUrl || null,
            transcript: meetingData.transcript || null,
            minutes: meetingData.minutes || null,
            meta_data: meetingData.metaData || null,
            scheduledAt,
        };

        await meetingRef.set(newMeetingData);
        return {
            meetingId: meetingRef.id,
            ...newMeetingData,
            scheduledAt: scheduledAt ? scheduledAt.toDate().toISOString() : null,
        };
    } catch (error) {
        throw error;
    }
}

export async function deleteMeeting(userId, meetingId) {
    try {

        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp");
        }
        const meetingData = meetingDoc.data();
        if (meetingData.owner_id !== userId) {
            throw new Error("chỉ chủ cuộc họp mới xóa được cuộc họp");
        }
        deleteByMeetingId(meetingId);
        await meetingRef.delete();
        return { meetingId }
    } catch (error) {
        throw new Error(error.message || "Không thể xóa cuộc họp");
    }
}

export async function updateMeeting(userId, meetingId, updateData) {
    try {
        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp");
        }

        const meetingData = meetingDoc.data();
        if (meetingData.owner_id !== userId) {
            throw new Error("Chỉ chủ cuộc họp mới được phép sửa");
        }

        if (meetingData.status && meetingData.status === "signed") {
            throw new Error("Cuộc họp đã được ký, không thể chỉnh sửa");
        }
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (updateData.title) updates.title = updateData.title;
        if (updateData.description) updates.description = updateData.description;
        if (updateData.metaData) updates.meta_data = updateData.metaData;

        if (updateData.scheduledAt) {
            const dateObj = new Date(updateData.scheduledAt);
            if (isNaN(dateObj.getTime())) {
                throw new Error("Thời gian họp không hợp lệ");
            }
            updates.scheduledAt = admin.firestore.Timestamp.fromDate(dateObj);
        }

        await meetingRef.update(updates);

        const updatedDoc = await meetingRef.get();
        return {
            meetingId,
            ...updatedDoc.data(),
            scheduledAt: updatedDoc.data().scheduledAt
                ? updatedDoc.data().scheduledAt.toDate().toISOString()
                : null,
            createdAt: updatedDoc.data().createdAt
                ? updatedDoc.data().createdAt.toDate().toISOString()
                : null,
            updatedAt: updatedDoc.data().updatedAt
                ? updatedDoc.data().updatedAt.toDate().toISOString()
                : null,
        };
    } catch (error) {
        throw new Error(error.message || "Không thể cập nhật cuộc họp");
    }
}

export async function getMeeting(userId, meetingId) {
    try {
        const meetingRef = db.collection("meetings").doc(meetingId);
        const meetingDoc = await meetingRef.get();
        if (!meetingDoc.exists) {
            throw new Error("Không tồn tại cuộc họp");
        }
        const meetingData = meetingDoc.data();
        const groupId = meetingData.group_id;
        const groupRef = db.collection("groups").doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) {
            throw new Error("Không tồn tại group");
        }

        const memberRef = groupRef.collection("members").doc(userId);
        const memberDoc = await memberRef.get();
        if (!memberDoc.exists) {
            throw new Error("User không thuộc group này, không có quyền xem chi tiết cuộc họp");
        }

        const result = {
            title: meetingData.title,
            audioUrl: meetingData.audio_url,
            createdAt: meetingData.createdAt?.toDate().toISOString() || null,
            description: meetingData.description || "",
            minutes: {
                sampleMinute: meetingData.minutes?.sampleMinute || null,
                officeMinute: meetingData.minutes?.officeMinute || null,
                signedMinute: meetingData.minutes?.signedMinute || null,
                signedAt: meetingData.minutes?.signedAt
                    ? meetingData.minutes.signedAt.toDate().toISOString()
                    : null,
                signerEmails: meetingData.minutes?.signerEmails,
            },
            ownerId: meetingData.owner_id,
            scheduledAt: meetingData.scheduledAt?.toDate().toISOString() || null,
            status: meetingData.status || "unknown",
            transcript: meetingData.transcript || null,
        };
        return result;
    } catch (error) {
        throw new Error(error.message || "Lối không lấy được chi tiết cuộc họp");

    }
}