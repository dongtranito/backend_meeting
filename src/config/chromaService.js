import { ChromaClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const client = new ChromaClient({
    host: "localhost",
    port: 8000,
    ssl: false,
});

const embedder = new GoogleGeminiEmbeddingFunction({
    apiKey: process.env.GEMINI_API_KEY,
});

const collection = await client.getOrCreateCollection({
    name: "MeetingDB",
    embeddingFunction: embedder,
});

// Lấy hoặc tạo collection

export async function addDocument(segments, groupId, meetingId) {
    const ids = segments.map(() => crypto.randomUUID());
    const metadatas = segments.map(() => ({
        groupId,
        meetingId,
    }));

    await collection.upsert({
        ids,
        documents: segments,
        metadatas,
    });
    return "đã thêm thành công"
}   // ông nội này cho thêm nhiều document cùng lúc. nên là nó cái nào cũng là mãng hết

export async function deleteByMeetingId(meetingId) {

    await collection.delete({
        where: { meetingId: meetingId },
    });

    return `Đã xóa embedding thành công, ${meetingId}`;
}

export async function searchSimilar({
    query,
    meetingId = null,
    groupId = null,
    limit = 10
}) {
    try {
        if (!groupId && !meetingId) {
            throw new Error("Cần có groupId hoặc meetingId để lọc kết quả.");
        }

        if (groupId && meetingId) {
            throw new Error("Chỉ được chọn 1 trong 2: groupId hoặc meetingId, không được truyền cả hai.");
        }

        let where = {};
        if (meetingId) {
            where = { meetingId: meetingId };
        } else if (groupId) {
            where = { groupId: groupId };
        }

        const results = await collection.query({
            queryTexts: [query],
            nResults: limit,
            where,
        });

        const documents = results.documents?.[0] || [];
        const metadatas = results.metadatas?.[0] || [];

        const merged = documents.map((doc, index) => ({
            text: doc,
            groupId: metadatas[index]?.groupId || null,
            meetingId: metadatas[index]?.meetingId || null,
        }));

        console.log("🔍 Kết quả tìm thấy:", merged);
        return merged;
    } catch (error) {
        throw error
    }
}


// [
//   {
//     text: "Biên bản họp nhóm ReNews",
//     groupId: "groupA",
//     meetingId: "meeting01"
//   },
//   {
//     text: "Kế hoạch thiết kế sản phẩm tái chế",
//     groupId: "groupA",
//     meetingId: "meeting02"
//   }
// ]
