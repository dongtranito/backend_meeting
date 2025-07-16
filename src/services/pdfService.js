// File: generateMinutes.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
// Đổi mm sang point (1 mm ≈ 2.835 point)
const mm = val => val * 2.835;

function centerTextInRange(doc, text, xStart, xEnd, y, options = {}) {
  const { font = 'R', fontSize = 12, color = 'black' } = options;
  const width = xEnd - xStart;
  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(text, xStart, y, {
    width: width,
    align: 'center',
    });
}
function generateMeetingMinutes(data, outputPath) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait', // Dọc
    margins: {
      top: mm(25),       // 25mm
      bottom: mm(25),    // 25mm
      left: mm(25),      // 35mm
      right: mm(20)      // 20mm
    }
  });

  doc.pipe(fs.createWriteStream(outputPath));
  doc.registerFont("B", "Roboto-Bold.ttf");
  doc.registerFont("R", "Roboto-Regular.ttf")
  const pageWidth = doc.page.width;
  console.log("pageWidth", pageWidth);
  console.log("y", doc.y);

  const x = doc.x;
  const y = doc.y;
  centerTextInRange(doc, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 300, 550, null, { font: "B" })
  doc.moveDown(0.5);
  centerTextInRange(doc, "Độc lập - Tự do - Hạnh phúc", 300, 550, null, { font: "B" });
  // Vẽ đường gạch dưới chữ “Độc lập - Tự do - Hạnh phúc”
  const underlineY = doc.y + 1; // Dưới text 1-2 point cho đẹp (tùy chỉnh thêm)
  const textWidth = doc.widthOfString("Độc lập - Tự do - Hạnh phúc", { font: "B", fontSize: 13 });
  const xStart = (300 + ((550 - 300) - textWidth) / 2);
  const xEnd = xStart + textWidth;

  // Ngày tháng năm  
  doc.moveDown(1);
  centerTextInRange(doc, `${data.dia_diem}, ${data.ngay}`, 300, 550, null);
  doc.moveTo(xStart, underlineY).lineTo(xEnd, underlineY).stroke();

  // Cơ quan đơn vị, số
  centerTextInRange(doc, data.co_quan, 20, 330, y, { font: "B" });
  doc.moveDown(2.5);
  centerTextInRange(doc, "số " + data.so, 20, 330, null);


  doc.moveDown(2.5);
  // Ghi chữ biên bản họp
  doc.font('B')
    .fontSize(14)
    .text('BIÊN BẢN', {
      align: 'center'
    });

  doc.font("R")  // Đặt font trước
    .fontSize(12)
    .text(data.ten_cuoc_hop, { align: "center" });

  // Phần I la mã 
  doc.x = doc.page.margins.left;
  doc.moveDown(1);
  doc.font("B").text("I. Thành phần tham dự: ");


  // Dòng 1
  doc.font("R").text("1. Chủ trì: " + data.chu_tri.ten, { lineBreak: false });
  doc.font("R").text("Chức vụ: " + data.chu_tri.cv + ".", 250);

  // Dòng 2
  doc.x = doc.page.margins.left;
  doc.font("R").text("2. Thư ký: " + data.thu_ky.ten, { lineBreak: false });
  doc.font("R").text("Chức vụ: " + data.thu_ky.cv + ".", 250);

  // Dòng các thành phần khác
  doc.x = doc.page.margins.left;
  doc.font("R").text("3. Các thành phần khác:", { continued: false });
  doc.moveDown(0.5);

  data.thanh_phan.forEach((thanh_phan, index) => {
    doc.x = doc.page.margins.left;
    const leftText = `     ${thanh_phan.ten}`;
    const rightText = `Chức vụ: ${thanh_phan.cv}.`;

    doc.font("R").text(leftText, { lineBreak: false });
    doc.font("R").text(rightText, 250);
  });

  // Phần II la mã
  doc.x = doc.page.margins.left;

  doc.moveDown(1);
  doc.font("B").text("II. Nội dung cuộc họp:  ");
  doc.font("R").text(data.noi_dung, {
    align: 'justify',
    lineGap: 1

  });

  // Phần III la mã
  doc.moveDown(1);
  doc.x = doc.page.margins.left;
  doc.font("B").text("III. Kết luận: ");
  data.ket_luan.forEach((ket_luan_item, index) => {
    doc.x = doc.page.margins.left;
    doc.font("R").text(`• ${ket_luan_item}`, {
      align: 'justify',
      lineGap: 1
    });
  });
  doc.moveDown(3)
  doc.font("R").text("Cuộc họp kết thúc " + data.gio_ket_thuc + " " + data.ngay + ",")
  doc.font("R").text("Nội dung cuộc họp đã được các thành viên dự họp thông qua và cùng ký vào biên bản.")
  doc.moveDown(2);
  doc.font("R").text("Biên bản được các thành viên nhất trí thông qua và có hiệu lực kể từ ngày ký./.");

  // Phần III la mã
  doc.moveDown(1);
  doc.x = doc.page.margins.left;
  doc.font("B").text("IV. Chữ ký của người tham dự: ");

  // Giữ nguyên doc.moveDown để tạo khoảng trắng
  doc.moveDown(4);

  // Lưu lại y hiện tại để các dòng dưới dùng chung một vị trí
  let ySignature = doc.y;
  // THƯ KÝ (trái)
  console.log(ySignature,doc.y);
  centerTextInRange(doc, "THƯ KÝ", 50, 300, ySignature, { font: "B", fontSize: 12 });
  if (ySignature!=doc.y){
    ySignature=doc.y-doc.currentLineHeight();
  }
  console.log(ySignature,doc.y);

  centerTextInRange(doc, "(Ký, ghi rõ họ tên)", 50, 300, doc.y , { font: "R", fontSize: 11 });

  // CHỦ TOẠ (phải)
  centerTextInRange(doc, "CHỦ TOẠ", 300, 500, ySignature, { font: "B", fontSize: 12 });
  centerTextInRange(doc, "(Ký, ghi rõ họ tên)", 300, 500, doc.y, { font: "R", fontSize: 11 });

  doc.moveDown(10);
  // CÁC THÀNH VIÊN KHÁC (ở giữa phía dưới)
  centerTextInRange(doc, "CÁC THÀNH VIÊN KHÁC", 100, 495,doc.y  ,{ font: "B", fontSize: 12 });
  centerTextInRange(doc, "(Ký, ghi rõ họ tên)", 100, 495, doc.y, { font: "R", fontSize: 11 });


  doc.end();
};
// Giờ tôi muốn 

// Data cứng
const meetingData ={
  "chu_tri": {
    "cv": "Trưởng bộ phận Kỹ thuật",
    "ten": "Anh Quang"
  },
  "co_quan": "Cơ quan tổ chức###",
  "dia_diem": "Địa điểm họp###",
  "gio": "Thời gian bắt đầu họp###",
  "gio_ket_thuc": "Thời gian kết thúc họp###",
  "ket_luan": [
    "Hệ thống gặp downtime từ 3h sáng do lỗi memory leak trong backend mới, đã rollback phiên bản về bản cũ và đang theo dõi ổn định.",       
    "Truyền thông sẽ gửi email xin lỗi khách hàng và cập nhật tình hình liên tục.",
    "Thiết lập hệ thống log chi tiết để kiểm tra nguyên nhân sâu hơn.",
    "Dự kiến sẽ deploy lại phiên bản đã fix lỗi vào sáng mai.",
    "Gửi mã giảm giá 15% cho khách hàng bị ảnh hưởng nặng.",
    "Đội CSKH đã sẵn sàng phản hồi tự động qua chatbot và email.",
    "Review toàn bộ quy trình release và kiểm thử trước khi đẩy bản mới.",
    "Tổ chức cuộc họp kỹ thuật chuyên sâu vào chiều nay để thảo luận chi tiết hơn.",
    "Lên danh sách các microservice dễ gây lỗi nhất để audit lại trong tuần này.",
    "Ưu tiên khôi phục ổn định hệ thống."
  ],
  "ngay": "Ngày họp###",
  "noi_dung": "Thảo luận về tình trạng downtime hệ thống do lỗi memory leak, các biện pháp khắc phục, thông báo cho khách hàng và kế hoạch ngăn ngừa sự cố tương tự trong tương lai.",
  "so": "Số biên bản###",
  "ten_cuoc_hop": "Cuộc họp khẩn xử lý sự cố downtime hệ thống",
  "thanh_phan": [
    {
      "cv": "Trưởng bộ phận Kỹ thuật",
      "ten": "Anh Quang"
    },
    {
      "cv": "Kỹ sư Phát triển Backend",
      "ten": "Chị Hạnh"
    },
    {
      "cv": "Kỹ sư Hạ tầng",
      "ten": "Anh Lâm"
    },
    {
      "cv": "Trưởng phòng Chăm sóc khách hàng",
      "ten": "Chị Mai"
    }
  ],
  "thu_ky": {
    "cv": "Chức vụ thư ký###",
    "ten": "Thư ký###"
  }
};

// Chạy sinh PDF
generateMeetingMinutes(meetingData, 'BienBanHop.pdf');
console.log('PDF đã được sinh ra: BienBanHop.pdf');
