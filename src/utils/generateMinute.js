import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import mammoth from "mammoth"
import axios from "axios";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { uploadToS3 } from "../config/s3Service.js";



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

export async function loadDocxBufferFromUrl(url) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
}
// Đây là data được gởi để tạo transcript
// const data = {
//   urlSampleMinute: meetingData.minutes.sampleMinute,
//   title: meetingData.title || "",
//   description: meetingData.description || "",
//   scheduledAt: meetingData.scheduledAt.toDate().toISOString() || "",
//   transcriptText: transcript.text || "",
//   metaData: meetingData.meta_data || {},
// };
async function askAiToGenerateData(templateText, placeholders, data) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("⚠️ GEMINI_API_KEY not set in .env");
    const Schema = z.object(
        Object.fromEntries(placeholders.map((key) => [key, z.string()]))
    );


    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        apiKey,
    }).withStructuredOutput(Schema, { method: "json_schema" });

    const prompt = `
Bạn là hệ thống tạo dữ liệu mẫu cho file Word có chứa placeholder, và nội dung tham chiếu.
Nội dung tham chiếu: tiêu đề cuộc họp là ${data.title}, Mô tả cuộc họp là ${data.description}, lịch cuộc họp là ${data.scheduledAt}, và transcipt của cuộc họp là ${data.transcriptText}, metadata cuộc họp là ${data.metaData} 

Danh sách placeholder:
${JSON.stringify(placeholders)}

Nội dung file DOCX (trích từ mammoth):
------------------------
${templateText}
------------------------

🎯 Yêu cầu:
- Tạo ra object JSON có key "data".
- Trong "data", mỗi key là tên placeholder, value là dữ liệu mẫu hợp lý (ví dụ: tên, địa điểm, ngày, nội dung cuộc họp...).
- Dữ liệu phải là chuỗi text (string) đơn giản, không lồng object con.
- Trả về CHỈ JSON, không giải thích thêm.
- Phải dựa vào nội dung tham chiếu để tạo ra các placeholder. không được bịa chuyện. nếu nội dung tham chiếu không có thì trả lời kiểu #######. đặc biệt phải dựa vào transcipt để tạo ra nội dung cho biên bản

Ví dụ định dạng:
{
  "data": {
    "so": "01/2025",
    "diadiem": "Phòng họp A1",
    "ngay": "21",
    "thang": "10",
    "nam": "2025",
    "veviec": "Triển khai dự án mới",
    ...
  }
}
`;

    const result = await model.invoke([{ role: "user", content: prompt }]);
    return result;
}
export async function renderDocx(buffer, placeholder) {
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(placeholder);
    const outputBuffer = doc.getZip().generate({ type: "nodebuffer" });
    return outputBuffer;
}

export async function generateMinute(data) {
    try {
        const buffer = await loadDocxBufferFromUrl(data.urlSampleMinute);  //cái này là url biên bản mẫu
        // const buffer = await loadLocalDocx("./bienbancuochop.docx");

        const { value: templateText } = await mammoth.extractRawText({ buffer });
        const placeholders = await extractPlaceholdersWithDocx(buffer);

        const aiResult = await askAiToGenerateData(templateText, placeholders, data);
        const outputBuffer = await renderDocx (buffer,aiResult) // có nghĩa là render xong rồi mới buffer của nó

        const fileName = `minute_${Date.now()}.docx`;
        const { url } = await uploadToS3({
            folder: "officeMinute",
            fileName,
            fileBuffer: outputBuffer,
            contentType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        return {
            url,
            aiResult
        };

    } catch (error) {
        throw new Error(error.message || "bị lỗi ở bước tương tác với llm");
    }
}