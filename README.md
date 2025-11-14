# Backend Meeting Minutes API

Backend API cho hệ thống quản lý cuộc họp và biên bản, hỗ trợ:
- 🎙️ Chuyển đổi giọng nói thành văn bản (Speech-to-Text) với Azure Speech Service
- 🤖 Tóm tắt và tạo biên bản tự động bằng Google Gemini AI
- 📝 Quản lý nhóm, cuộc họp và biên bản
- ✍️ Ký điện tử biên bản với DocuSign
- 💬 Chatbot hỗ trợ tra cứu thông tin cuộc họp
- 🔐 Xác thực Firebase và JWT tokens

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth + JWT
- **Speech-to-Text:** Azure Cognitive Services
- **AI:** Google Gemini API
- **Storage:** AWS S3
- **Vector Database:** ChromaDB (RAG cho chatbot)
- **E-Signature:** DocuSign
- **PDF Generation:** Gotenberg
- **Audio Processing:** FFmpeg

## 📋 Yêu cầu hệ thống

- Node.js >= 14.x
- npm >= 6.x
- FFmpeg (để xử lý audio)

## ⚙️ Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/dongtranito/backend_meeting
cd backend_meeting
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc như file .env.sample

### 4. Cấu hình DocuSign

Đặt file private key của DocuSign vào thư mục gốc với tên `private.key`

## 🚀 Chạy dự án

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Server sẽ chạy tại `http://localhost:3001`

## 📁 Cấu trúc thư mục

```
backend_meeting/
├── src/
│   ├── app.js                 # Entry point
│   ├── chatbot/               # Chatbot logic với ChromaDB
│   │   ├── chatbot.js
│   │   ├── chatbotService.js
│   │   └── cronjob.js
│   ├── config/                # Cấu hình services
│   │   ├── chromaService.js
│   │   ├── firebaseService.js
│   │   └── s3Service.js
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── azureControllers.js
│   │   ├── groupController.js
│   │   ├── mettingController1.js
│   │   ├── minutesController.js
│   │   ├── uploadController.js
│   │   └── userController.js
│   ├── middlewares/           # Middleware functions
│   │   └── authMiddleware.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── azureRoute.js
│   │   ├── chatbotRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── hook.js
│   │   ├── meetingRoutes1.js
│   │   ├── minutesRoute.js
│   │   ├── uploadRoute.js
│   │   └── userRoutes.js
│   ├── services/              # Business logic
│   │   ├── azureTokenService.js
│   │   ├── docusignService.js
│   │   ├── geminiService.js
│   │   ├── groupService.js
│   │   ├── jwtService.js
│   │   ├── meetingService1.js
│   │   ├── minutesService.js
│   │   ├── pdfService.js
│   │   ├── uploadService.js
│   │   └── userService.js
│   ├── utils/                 # Utilities
│   │   ├── generateMinute.js
│   │   └── mergeAudio.js
│   └── hook/                  # Webhooks
│       └── docusignHook.js
├── uploads/                   # Temporary upload storage
├── .env                       # Environment variables
└── package.json
```

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Đăng nhập với Firebase ID Token | ❌ |
| POST | `/refresh-token` | Làm mới access token | Refresh Token |
| POST | `/logout` | Đăng xuất | ✅ |
| GET | `/profile` | Lấy thông tin người dùng | ✅ |

### 👥 Group Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/get-list-group` | Lấy danh sách nhóm | ✅ |
| POST | `/creat-group` | Tạo nhóm mới | ✅ |
| GET | `/detail-group/:groupId` | Lấy chi tiết nhóm và danh sách thành viên | ✅ |
| PUT | `/update-group/:groupId` | Cập nhật thông tin nhóm | ✅ |
| DELETE | `/delete-group/:groupId` | Xóa nhóm | ✅ |
| POST | `/invite-member` | Mời thành viên vào nhóm | ✅ |
| DELETE | `/remove-member` | Xóa thành viên khỏi nhóm | ✅ |
| POST | `/leave-group` | Rời khỏi nhóm | ✅ |
| PUT | `/update-member` | Cập nhật quyền thành viên | ✅ |

### 📅 Meeting Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/get-list-meeting?groupId=xxx` | Lấy danh sách cuộc họp theo nhóm | ✅ |
| POST | `/create-meeting` | Tạo cuộc họp mới | ✅ |
| GET | `/meeting/:meetingId` | Lấy chi tiết cuộc họp | ✅ |
| PUT | `/update-meeting/:meetingId` | Cập nhật thông tin cuộc họp | ✅ |
| DELETE | `/delete-meeting/:meetingId` | Xóa cuộc họp | ✅ |

### 📝 Minutes Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-minute` | Tạo biên bản từ audio URL | ✅ |
| GET | `/minute/:meetingId` | Lấy biên bản của cuộc họp | ✅ |
| PUT | `/minute/:meetingId/update` | Cập nhật nội dung biên bản | ✅ |
| POST | `/minute/:meetingId/sign` | Gửi biên bản để ký điện tử | ✅ |
| GET | `/minute/:meetingId/sample-minute` | Lấy danh sách biên bản mẫu | ✅ |

### 📤 Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload/metadata` | Upload metadata file | ✅ |
| POST | `/upload/record` | Upload file ghi âm cuộc họp | ✅ |
| POST | `/upload/sample-minute` | Upload biên bản mẫu (Word) | ✅ |

### 👤 User

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-sample-voice` | Tạo mẫu giọng nói người dùng | ✅ |
| GET | `/getSampleVoice` | Lấy thông tin mẫu giọng nói | ✅ |

### 🎤 Azure Speech

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/token` | Lấy Azure Speech token | ✅ |
| POST | `/api/receiveSpeech` | Nhận kết quả speech-to-text | ✅ |

### 💬 Chatbot

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat` | Chat với AI về nội dung cuộc họp | ✅ |

### 🔔 Webhooks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/hook/docusign` | Webhook nhận sự kiện từ DocuSign | ❌ |

### 🛠️ Utilities

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cronjob` | Refresh ChromaDB manually | ❌ |

## 📖 Chi tiết API

Xem đầy đủ API documentation tại: [Postman Documentation](https://documenter.getpostman.com/view/33415374/2sB3QNq92p)

## 🔒 Authentication Flow

1. Client gửi Firebase ID Token qua `/login`
2. Server verify token với Firebase Admin SDK
3. Tạo user trong Firestore (nếu chưa có)
4. Trả về Access Token (1200 phút) và Refresh Token (7 ngày) qua HTTP-only cookies
5. Client gửi kèm cookie hoặc Bearer token trong header cho các request sau
6. Khi Access Token hết hạn, dùng `/refresh-token` để lấy token mới

## 🎯 Các chức năng chính

### 1. Tạo biên bản tự động
- Upload file audio lên S3
- Azure Speech Service chuyển đổi thành text (transcript)
- Gemini AI phân tích và tạo biên bản có cấu trúc
- Lưu vào Firestore

### 2. Chatbot RAG
- ChromaDB lưu trữ vector embeddings của transcript
- Khi chat, tìm kiếm ngữ cảnh liên quan
- Gemini AI trả lời dựa trên context

### 3. Ký điện tử
- Tạo PDF từ biên bản (sử dụng Gotenberg)
- Gửi qua DocuSign để ký
- Nhận webhook khi hoàn thành

### 4. Quản lý nhóm & quyền
- Owner có toàn quyền
- Member có thể là editor hoặc viewer
- Phân quyền chi tiết cho từng hành động

## 🔧 Scripts

```json
{
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}
```

## 🛡️ Bảo mật

- ✅ HTTP-only cookies cho tokens
- ✅ CORS configuration
- ✅ JWT verification middleware
- ✅ Firebase Authentication


**Developer:** Đồng Trần  
**Repository:** [github.com/dongtranito/backend_meeting](https://github.com/dongtranito/backend_meeting)

## 📄 License

Private Project - All Rights Reserved
