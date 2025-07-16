const { GoogleGenAI, Type } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sumarySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    highlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          text: { type: Type.STRING }
        },
        required: ["title", "text"]
      }
    },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          text: { type: Type.STRING }
        },
        required: ["title", "text"]
      }
    }
  },
  required: ["title", "summary", "highlights", "insights"]
};


const bienBanSchema = {
  type: Type.OBJECT,
  properties: {
    ten_cuoc_hop: { type: Type.STRING },
    chu_tri: {
      type: Type.OBJECT,
      properties: {
        cv: { type: Type.STRING },
        ten: { type: Type.STRING }
      },
      required: ["cv", "ten"]
    },
    co_quan: { type: Type.STRING },
    dia_diem: { type: Type.STRING },
    noi_dung: { type: Type.STRING },
    gio: { type: Type.STRING },
    ket_luan: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    gio_ket_thuc: { type: Type.STRING },
    ngay: { type: Type.STRING },
    so: { type: Type.STRING },
    thanh_phan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cv: { type: Type.STRING },
          ten: { type: Type.STRING }
        },
        required: ["cv", "ten"]
      }
    },
    thu_ky: {
      type: Type.OBJECT,
      properties: {
        cv: { type: Type.STRING },
        ten: { type: Type.STRING }
      },
      required: ["cv", "ten"]
    }
  },
  required: [
    "ten_cuoc_hop",
    "chu_tri",
    "co_quan",
    "dia_diem",
    "noi_dung",
    "gio",
    "ket_luan",
    "gio_ket_thuc",
    "ngay",
    "so",
    "thanh_phan",
    "thu_ky"
  ]
};

async function summarizeTranscript(transcriptRaw) {

const prompt = `
  Bạn sẽ được cung cấp transcript một cuộc họp (gồm timestamp và nội dung của người nói). Hãy phân tích nội dung và trả kết quả ở dạng JSON như sau:
  
  {
    "title": "<Tiêu đề ngắn gọn đại diện cho toàn bộ cuộc họp>",
    "summary": "<Tóm tắt 4–6 câu mô tả nội dung tổng quan của cuộc họp>",
    "highlights": [
      { "title": "<Tiêu đề ngắn gọn>", "text": "<Một câu mô tả ngắn>" }
    ],
    "insights": [
      { "title": "<Tiêu đề phân tích sâu>", "text": "<Phân tích dài 2–3 câu, thể hiện cảm xúc, chiến lược hoặc góc nhìn sâu sắc>" }
    ]
  }

  ⛔ Không thêm văn bản bên ngoài JSON. Không giải thích. Chỉ trả về đúng định dạng JSON.

  Dưới đây là transcript cuộc họp:
  ${JSON.stringify(transcriptRaw.transcript)}
  Dưới đây là thời gian cuộc họp kết thúc:
  ${JSON.stringify(transcriptRaw.thoiGianKetThuc)}
  Dưới đây là yêu cầu của người dùng:
  ${JSON.stringify(transcriptRaw.transcriptChat)}
`;




  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: sumarySchema
    }
  });
  //   const text = response.text();
  const text = response.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Không parse được JSON từ Gemini: " + err.message);
  }
}



async function generateBienBan(transcriptRaw) {
  const prompt = `
  Bạn sẽ được cung cấp một transcript cuộc họp, thời gian kết thúc cuộc họp, và yêu cầu của người dùng . Bạn hãy phân tích và trích xuất thông tin để tạo một biên bản cuộc họp có dạng JSON với cấu trúc sau:
  
  {
    "ten_cuoc_hop": "Tên cuộc họp (ví dụ: 'Cuộc họp về Kỹ thuật công nghệ')",
    "chu_tri": { "cv": "Chức vụ", "ten": "Tên người chủ trì" },
    "co_quan": "Tên cơ quan, công ty tổ chức cuộc họp",
    "dia_diem": "Địa điểm tổ chức cuộc họp",
    "noi_dung": "Mô tả ngắn gọn nội dung chính của cuộc họp",
    "gio": "Thời gian bắt đầu cuộc họp (ví dụ: '09:00')",
    "ket_luan": [
      "Các kết luận chính trong cuộc họp, mỗi mục là 1 kết luận cụ thể."
    ],
    "gio_ket_thuc": "Thời gian kết thúc cuộc họp (ví dụ: '10:30')",
    "ngay": "Ngày diễn ra cuộc họp (ví dụ: 'ngày 22 tháng 05 năm 2024')",
    "so": "Số hiệu biên bản (ví dụ: 'BB-2024-001')",
    "thanh_phan": [
      { "cv": "Chức vụ", "ten": "Tên người tham dự" }
    ],
    "thu_ky": { "cv": "Chức vụ", "ten": "Tên người làm thư ký" }
  }
  
  ⛔ Yêu cầu:
  - Chỉ trả về **JSON đúng cấu trúc trên**, tuyệt đối **không thêm giải thích, không ghi chú**.
  - Dữ liệu cần hợp lý, khớp với transcript.
  - Nếu thiếu thông tin cụ thể trong transcript, hãy ghi bằng **tiếng Việt rõ ràng, dễ hiểu, có dấu "###"** để dễ tìm sau:
    - Ví dụ:
      - "Tên cuộc họp###"
      - "Cơ quan tổ chức###"
      - "Địa điểm họp###"
      - "Ngày họp###"
      - "Số biên bản###"
      - Các mục khác áp dụng tương tự nếu cần.
  - Diễn giải nội dung ngắn gọn, súc tích, dễ hiểu.
  - Ưu tiên ghi kết luận rõ ràng, dễ hành động, sắp xếp đúng thứ tự transcript.
  
  Dưới đây là transcript cuộc họp:
  ${JSON.stringify(transcriptRaw.transcript)}
  Dưới đây là thời gian cuộc họp kết thúc:
  ${JSON.stringify(transcriptRaw.thoiGianKetThuc)}
  Dưới đây là yêu cầu của người dùng:
  ${JSON.stringify(transcriptRaw.transcriptChat)}

  Nếu có biên bản cũ thì dựa lên biên bản cũ thì dựa vào biên bản cũ generate tiếp nha: 
  ${JSON.stringify(transcriptRaw.bienBanData)}

  `;



  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: bienBanSchema
    }
  });

  const text = response.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Không parse được JSON từ Gemini: " + err.message);
  }
}





async function regenerateBienBan(originalBienBan, userInstruction, transcriptRaw) {
  const prompt = `
Bạn là trợ lý AI. Hãy chỉnh sửa hoặc bổ sung nội dung vào biên bản cuộc họp bên dưới **dựa trên transcript gốc và yêu cầu người dùng**.

📄 Đây là biên bản cuộc họp hiện tại (có thể chưa đầy đủ):
${JSON.stringify(originalBienBan, null, 2)}

🗒️ Đây là transcript cuộc họp gốc:
${JSON.stringify(transcriptRaw)}

🛠️ Đây là yêu cầu của người dùng:
"${userInstruction}"

🎯 Hãy chỉnh sửa biên bản sao cho phù hợp với yêu cầu trên, đảm bảo mọi thông tin phải **tham chiếu chính xác từ transcript**. Nếu người dùng yêu cầu viết chi tiết thêm về một nội dung, hãy tìm phần đó trong transcript rồi viết lại dài hơn.

⛔ Trả lại **JSON hoàn chỉnh duy nhất**, không thêm văn bản ngoài JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: bienBanSchema
    }
  });

  const text = response.candidates[0].content.parts[0].text;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Không parse được JSON từ Gemini: " + err.message);
  }
}









// const result = summarizeTranscript(transcriptRaw);
// const bienBan = generateBienBan(transcriptRaw);

module.exports = { summarizeTranscript, generateBienBan, regenerateBienBan };