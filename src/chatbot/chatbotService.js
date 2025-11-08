import { db } from '../config/firebaseService.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { searchSimilar } from "../config/chromaService.js";
import dotenv from "dotenv";
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

export async function streamPromptGroupId(userId, prompt, groupId) {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) throw new Error("Group not found");

    const groupData = groupDoc.data();

    // Kiểm tra thành viên
    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists)
      throw new Error("Bạn không phải là thành viên trong group này nên không có quyền dùng chatbot");
    
    const results = await searchSimilar({ query: prompt, groupId });

    const meetingInfos = await Promise.all(
      results.map(async (r) => {
        const meetingRef = db.collection("meetings").doc(r.meetingId);
        const meetingDoc = await meetingRef.get();

        if (!meetingDoc.exists) return ""; 

        const m = meetingDoc.data();

        return `
Câu nói: ${r.text} nằm trong 
Cuộc họp: ${m.title || "Không có tiêu đề"}
- Mô tả: ${m.description || "Không có mô tả"}
- Ngày tạo: ${m.createdAt?.toDate().toISOString() || "không rõ"}
- Lịch họp: ${m.scheduledAt?.toDate().toISOString() || "không rõ"}
- Trạng thái (đã được ký cuộc họp hay chưa): ${m.status === "signed" ? "Đã ký" : "Chưa ký"}
---
`;
      })
    );
    const enrichedMeetings = meetingInfos.join("\n");
    const finalPrompt = `
Bạn là trợ lý ảo của nhóm "${groupData.name}".
Thông tin nhóm:
- Mô tả: ${groupData.description || "Không có mô tả"}
- Ngày tạo: ${groupData.createdAt?.toDate().toISOString()}

Dưới đây là các thông tin các transcript cuộc họp có vector tương đồng:
${enrichedMeetings}

Người dùng hỏi: ${prompt}
`;
    console.log("hi", finalPrompt)
    const stream = await llm.stream(finalPrompt);
    return stream;

  } catch (error) {
    throw error;
  }
}

export async function streamPromptMeetingId(userId, prompt, meetingId) {
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

    const results = await searchSimilar({ query: prompt, meetingId });

    const mergedContext = results
      .map((r) => ` ${r.text}`)
      .join("\n---\n");

    const finalPrompt = `
Bạn là trợ lý ảo của cuộc họp "${meetingData.title}" thuộc nhóm "${groupDoc.data().name}".
Thông tin cuộc họp:
- Mô tả: ${meetingData.description || "Không có mô tả"}
- Ngày họp: ${meetingData.scheduledAt?.toDate().toISOString()}
- Ngày tạo: ${meetingData.createdAt?.toDate().toISOString()}
- Trạng thái (đã được ký cuộc họp hay chưa):  ${meetingData.status === "signed" ? "Đã ký" : "Chưa ký"}

Nội dung tương đồng trong vector database:
${mergedContext}

Câu hỏi người dùng: ${prompt}
`;
    console.log ("hihi", finalPrompt)
    const stream = await llm.stream(finalPrompt);
    return stream;

  } catch (error) {
    throw error;
  }
}
