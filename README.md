# projectThuctap

Dự án Node.js sử dụng Firebase, Azure, Gemini API để quản lý xác thực, cuộc họp và các dịch vụ liên quan.

## Yêu cầu hệ thống

- Node.js >= 14.x
- npm >= 6.x

## Cài đặt

1. Clone repository:
   ```sh
   git clone https://github.com/your-username/your-repo.git
   cd projectThuctap
   ```

2. Cài đặt các package:
   ```sh
   npm install
   ```

3. Thêm file cấu hình Firebase:
   - Đặt file `serviceAccountKey.json` vào thư mục `src/services/`.
   - **Lưu ý:** Không chia sẻ file này công khai.

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

- Tên bạn hoặc nhóm phát triển
- Email liên hệ (nếu cần) 