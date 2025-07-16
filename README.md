#  Backend Meeting Minutes

Dự án backend dùng để xử lý **cuộc họp**, bao gồm:
-  Chuyển giọng nói thành văn bản (speech-to-text)
-  Tóm tắt nội dung cuộc họp bằng AI (Gemini)
-  Lưu trữ và quản lý biên bản họp

Sử dụng: **Node.js**, **Firebase Admin**, **Azure Speech Service**, và **Gemini API**
## Yêu cầu hệ thống

- Node.js >= 14.x
- npm >= 6.x

## Cài đặt

1. Clone repository:
   ```sh
   git clone https://github.com/dongtranito/backend_meeting
   cd projectThuctap
   ```

2. Cài đặt các package:
   ```sh
   npm install
   ```

3. Thêm file cấu hình Firebase:
   - Đặt file `serviceAccountKey.json` vào thư mục `src/services/`.
   - **Lưu ý:** Không chia sẻ file này công khai.
  
## 🌱 Cấu hình môi trường

Tạo file `.env` trong thư mục gốc và thêm các biến sau:

```env
PORT=3001  
NODE_ENV=development

AZURE_SPEECH_KEY=...
AZURE_REGION=southeastasia

GEMINI_API_KEY=...

## Chạy dự án

```sh
node src/app.js
```

Hoặc nếu có script trong package.json:
```sh
npm start
```

## Cấu trúc thư mục

```
src/
  app.js
  controllers/
  middlewares/
  routes/
  services/
  utils/
```

## Lưu ý bảo mật

- Không đẩy file `serviceAccountKey.json` lên GitHub.
- Sử dụng file `.env` để lưu các biến môi trường nhạy cảm.

## Liên hệ

ĐồngTrần
