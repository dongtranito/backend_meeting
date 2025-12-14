import { ChromaClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

let client = null;
let collection = null;

// --- Hàm khởi tạo an toàn ---
async function initChroma() {
  try {
    if (collection) return collection;

    client = new ChromaClient({
      path: process.env.CHROMA_URL,
    });

    const embedder = new GoogleGeminiEmbeddingFunction({
      apiKey: process.env.GEMINI_API_KEY,
    });

    collection = await client.getOrCreateCollection({
      name: "MeetingDB",
      embeddingFunction: embedder,
    });

    console.log("✅ Đã kết nối Chroma thành công!");
    return collection;
  } catch (err) {
    console.error("⚠️ Không thể kết nối ChromaDB:", err.message);
    collection = null; // reset về null để biết là chưa có
    return null;
  }
}

// --- Thêm tài liệu ---
export async function addDocument(segments, groupId, meetingId) {
  try {
    const col = await initChroma();
    if (!col) {
      console.warn("⚠️ Bỏ qua addDocument — chưa có kết nối Chroma");
      return "Chưa kết nối được ChromaDB";
    }

    const ids = segments.map(() => crypto.randomUUID());
    const metadatas = segments.map(() => ({ groupId, meetingId }));

    await col.upsert({ ids, documents: segments, metadatas });
    console.log ("đã thêm thành công " + segments)
    return "Đã thêm thành công!";
  } catch (error) {
    console.error("❌ Lỗi khi thêm document:", error.message);
    return "Lỗi khi thêm document";
  }
}

// --- Xóa theo meetingId ---
export async function deleteByMeetingId(meetingId) {
  try {
    const col = await initChroma();
    if (!col) return "Không có kết nối Chroma";

    await col.delete({ where: { meetingId } });
    console.log (`Đã xóa embedding thành công: ${meetingId}`)
    return `Đã xóa embedding thành công: ${meetingId}`;
  } catch (error) {
    console.error("❌ Lỗi khi xóa:", error.message);
    return "Lỗi khi xóa embedding";
  }
}

// --- Tìm kiếm tương tự ---
export async function searchSimilar({
  query,
  meetingId = null,
  groupId = null,
  limit = 10,
}) {
  try {
    const col = await initChroma();
    if (!col) return [];

    if (!groupId && !meetingId)
      throw new Error("Cần có groupId hoặc meetingId để lọc kết quả.");
    if (groupId && meetingId)
      throw new Error("Chỉ được chọn 1 trong 2: groupId hoặc meetingId.");

    const where = meetingId ? { meetingId } : { groupId };
    const results = await col.query({
      queryTexts: [query],
      nResults: limit,
      where,
    });

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];

    const mergedMap = {};

    documents.forEach((doc, i) => {
      const meetingId = metadatas[i]?.meetingId || null;
      if (!meetingId) return;

      if (!mergedMap[meetingId]) {
        mergedMap[meetingId] = {
          meetingId,
          texts: [],
        };
      }

      mergedMap[meetingId].texts.push(doc);
    });

    const merged = Object.values(mergedMap);
    console.log("🔍 Kết quả tìm thấy:", merged);
    return merged;
  } catch (error) {
    console.error("❌ Lỗi khi tìm kiếm:", error.message);
    return [];
  }
}
