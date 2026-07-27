# Smart Booking Platform - Backend API

Dịch vụ Backend RESTful API được xây dựng bằng **Node.js**, **Express.js** và tích hợp trực tiếp với **Supabase Database & Authentication**.

---

## 📋 Thư mục dự án

```text
backend/
├── src/
│   ├── config/
│   │   └── supabase.js       # Khởi tạo Supabase Client (Anon & Service Role)
│   ├── controllers/          # Xử lý logic nghiệp vụ API
│   │   ├── amenityController.js
│   │   ├── apartmentController.js
│   │   └── locationController.js
│   ├── middlewares/          # Các Middleware trung gian
│   │   ├── authMiddleware.js # Kiểm tra JWT Token & Phân quyền Admin
│   │   └── errorMiddleware.js# Xử lý lỗi toàn cục (Global Error Handler)
│   ├── routes/               # Khai báo các đường dẫn API
│   │   ├── amenityRoutes.js
│   │   ├── apartmentRoutes.js
│   │   ├── locationRoutes.js
│   │   └── profileRoutes.js
│   └── index.js              # File khởi chạy server Express
├── package.json
└── README.md
```

---

## 🛠 Hướng dẫn Cài đặt & Chạy Server

### 1. Yêu cầu Tiền đề
File `.env` nằm ở thư mục gốc của dự án (`smart-booking-platform/.env`) cần chứa các biến môi trường sau:

```env
DATABASE_URL=postgresql://postgres.xxx:mật_khẩu@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # (Tùy chọn cho các tác vụ admin nâng cao)
PORT=5000
```

### 2. Cài đặt Dependencies
Mở terminal tại thư mục `backend`:
```bash
cd backend
npm install
```

### 3. Chạy Server
- **Môi trường phát triển (Dev mode với nodemon):**
  ```bash
  npm run dev
  ```
- **Môi trường Production:**
  ```bash
  npm start
  ```
Server sẽ khởi chạy tại: `http://localhost:5000`

---

## 👑 Hướng dẫn Gán quyền Admin cho Tài khoản

Để gán quyền **Admin** cho tài khoản đăng nhập (ví dụ: `th0935057511@gmail.com`), thực hiện các bước sau:

1. **Đăng ký tài khoản:** Tiến hành đăng ký email `th0935057511@gmail.com` qua ứng dụng/Supabase Auth nếu chưa đăng ký.
2. **Chạy script nâng quyền:** Chạy lệnh sau ở thư mục gốc dự án:
   ```bash
   npm run db:set-admin th0935057511@gmail.com
   ```
   *(Nếu không truyền email, mặc định script sẽ gán quyền cho `th0935057511@gmail.com`)*.

---

## 📑 Danh sách API Endpoints

### 1. Locations (Địa điểm)
| Method | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/locations/cities` | Lấy danh sách thành phố | Public |
| `GET` | `/api/locations/cities/:cityId/districts` | Lấy danh sách quận/huyện theo ID thành phố | Public |

### 2. Amenities (Tiện ích)
| Method | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/amenities` | Lấy danh sách toàn bộ tiện ích | Public |

### 3. Apartments (Căn hộ)
| Method | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/apartments` | Lấy danh sách căn hộ đã xuất bản (hỗ trợ filter, phân trang) | Public |
| `GET` | `/api/apartments/:slug` | Lấy chi tiết căn hộ theo slug | Public |
| `POST` | `/api/apartments` | Tạo căn hộ mới | Bearer Token (Admin) |
| `PUT` | `/api/apartments/:id` | Cập nhật thông tin căn hộ | Bearer Token (Admin) |
| `DELETE`| `/api/apartments/:id` | Xóa mềm căn hộ (Soft Delete) | Bearer Token (Admin) |

#### Các Query Parameters hỗ trợ cho `GET /api/apartments`:
- `city_id`: ID Thành phố
- `district_id`: ID Quận/Huyện
- `type`: Loại căn hộ (`serviced`, `studio`, `condo`, ...)
- `min_price`: Giá thuê tối thiểu (VND)
- `max_price`: Giá thuê tối đa (VND)
- `limit`: Số lượng kết quả (Mặc định: `20`)
- `offset`: Vị trí bắt đầu (Mặc định: `0`)

### 4. Profiles (Hồ sơ người dùng)
| Method | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profiles/me` | Lấy thông tin tài khoản & role hiện tại | Bearer Token |

---

## 🔐 Xác thực & Phân quyền (Authentication)

Đối với các API yêu cầu xác thực hoặc quyền Admin, truyền Supabase Access Token trong Header:

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
