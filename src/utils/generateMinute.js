import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
export async function extractPlaceholdersWithDocx(buffer) {
    try {
        const zip = new PizZip(buffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        const placeholders = new Set();
        const text = doc.getFullText();
        const regex = /{\s*(.*?)\s*}/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            placeholders.add(match[1].trim());
        }

        if (placeholders.size === 0) {
            throw new Error("Không tìm thấy placeholder nào trong file DOCX.");
        }
        return Array.from(placeholders);
    } catch (error) {
        throw new Error(`Lỗi khi trích xuất placeholder từ file Word: ${error.message}`);
    }
}