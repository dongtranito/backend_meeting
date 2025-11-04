import { db } from '../config/firebaseService.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { searchSimilar } from "../config/chromaService.js";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

export async function streamPromptGroupId(prompt, userId, groupId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error("Group not found");

    const groupData = groupDoc.data();

    // Kiểm tra thành viên
    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists)
      throw new Error("Bạn không phải là thành viên trong group này");

    // 🔍 Tìm tài liệu tương đồng trong Chroma
    const results = await searchSimilar({ query: prompt, groupId });

    // Ghép dữ liệu meetings có liên quan
    let enrichedMeetings = "";
    for (const r of results) {
      const meetingRef = db.collection("meetings").doc(r.meetingId);
      const meetingDoc = await meetingRef.get();
      if (meetingDoc.exists) {
        const m = meetingDoc.data();
        enrichedMeetings += `
Câu nói: ${r.text} nằm trong 
Cuộc họp: ${m.title || "Không có tiêu đề"}
- Mô tả: ${m.description || "Không có mô tả"}
- Ngày tạo: ${m.createdAt?.toDate().toISOString()}
- Lịch họp: ${m.scheduledAt?.toDate().toISOString()}
- Trạng thái: ${m.status || "Không rõ"}
---
`;
      }
    }

    const finalPrompt = `
Bạn là trợ lý ảo của nhóm "${groupData.name}".
Thông tin nhóm:
- Mô tả: ${groupData.description || "Không có mô tả"}
- Ngày tạo: ${groupData.createdAt?.toDate().toISOString()}

Dưới đây là các thông tin cuộc họp tương đồng:
${enrichedMeetings}

Người dùng hỏi: ${prompt}
`;

    // 🧠 Stream kết quả
    const stream = await llm.stream(finalPrompt);
    return stream;

  } catch (error) {
    console.error("❌ streamPromptGroupId Error:", error);
    throw error;
  }
}

// 🧠 Trả lời theo meetingId
export async function streamPromptMeetingId(prompt, userId, meetingId) {
  try {
    const meetingRef = db.collection("meetings").doc(meetingId);
    const meetingDoc = await meetingRef.get();
    if (!meetingDoc.exists) throw new Error("Không tồn tại cuộc họp");

    const meetingData = meetingDoc.data();
    const groupId = meetingData.group_id;

    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error("Không tồn tại group");

    // Kiểm tra user
    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists)
      throw new Error("User không thuộc group này, không có quyền dùng chatbot");

    // 🔍 Tìm trong Chroma
    const results = await searchSimilar({ query: prompt, meetingId });

    const mergedContext = results
      .map((r) => `📄 ${r.text}`)
      .join("\n---\n");

    const finalPrompt = `
Bạn là trợ lý ảo của cuộc họp "${meetingData.title}" thuộc nhóm "${groupDoc.data().name}".
Thông tin cuộc họp:
- Mô tả: ${meetingData.description || "Không có mô tả"}
- Ngày họp: ${meetingData.scheduledAt?.toDate().toISOString()}
- Trạng thái: ${meetingData.status || "Không rõ"}

Nội dung tương đồng:
${mergedContext}

Câu hỏi người dùng: ${prompt}
`;

    const stream = await llm.stream(finalPrompt);
    return stream;

  } catch (error) {
    console.error("❌ streamPromptMeetingId Error:", error);
    throw error;
  }
}
