# Medical Clinic Management System

Hệ thống quản lý phòng khám ngoại trú: bệnh nhân đặt lịch trực tuyến, lễ tân xác nhận và
điều phối tại quầy, bác sĩ khám và kê đơn, quản trị viên quản lý nhân sự và lịch trực.

Dự án portfolio, gồm REST API bằng Spring Boot và giao diện React đơn trang.

| | |
|---|---|
| Backend | Spring Boot 4.1.1 · Java 21 · MySQL 8 · Flyway · Spring Security + JWT |
| Frontend | React 19 · TypeScript · Vite · Ant Design 5 · TanStack Query · React Router |
| Kiểm thử | 151 test backend (JUnit 5 + Mockito + MockMvc), 48 test frontend (Vitest) |

## Cấu trúc kho mã

```text
medical-clinic/
├── backend/     REST API Spring Boot
├── frontend/    Ứng dụng React
└── docs/        Tài liệu phân tích và thiết kế
```

## Chức năng theo vai trò

**Bệnh nhân** — tự đăng ký tài khoản, xem danh bạ bác sĩ, đặt lịch theo khung giờ 30 phút,
xem và hủy lịch hẹn của mình, tra cứu bệnh án và đơn thuốc, cập nhật hồ sơ cá nhân.

**Lễ tân** — xác nhận lịch hẹn đang chờ, hủy lịch tại quầy, tra cứu bệnh nhân và đặt lịch hộ
cho bệnh nhân đến trực tiếp.

**Bác sĩ** — xem lịch khám của mình, ghi bệnh án và kê đơn thuốc, tra cứu lịch sử bệnh án của
bệnh nhân đã khám, cập nhật hồ sơ và xem lịch trực.

**Quản trị viên** — tạo tài khoản bác sĩ và lễ tân, khóa hoặc mở khóa tài khoản, xếp lịch trực
hàng tuần cho từng bác sĩ.

## Một số quy tắc nghiệp vụ đáng chú ý

Đây là những ràng buộc backend thực sự cưỡng chế, không chỉ là kiểm tra ở giao diện:

- **Ca khám 30 phút** sinh tự động từ lịch trực hàng tuần của bác sĩ. Sửa lịch trực là thay đổi
  toàn bộ khung giờ mà bệnh nhân đặt được.
- **Bệnh nhân chỉ hủy được trước giờ khám 2 tiếng.** Lễ tân hủy được kể cả sát giờ — đây là đặc
  quyền tại quầy, không phải lỗ hổng.
- **Lưu bệnh án đồng thời hoàn tất ca khám** trong cùng một transaction, và không hoàn tác được.
- **Mỗi bệnh án chỉ có một đơn thuốc**; gửi lần thứ hai trả về 409.
- **Bác sĩ chỉ tra cứu được bệnh án của bệnh nhân đã từng đặt lịch với mình**; vai trò DOCTOR
  không đủ. Đơn thuốc thì chỉ đọc được của ca khám do chính mình thực hiện.
- **Tài khoản nhân sự bị khóa chứ không xóa**, để lịch hẹn, bệnh án và đơn thuốc cũ còn nguyên
  để đối soát.
- **Ca trực còn lịch hẹn chưa khám thì không xóa được**, tránh làm bệnh nhân mất lịch đột ngột.
- **Không đặt trùng**: một khung giờ đã có người đặt, hoặc bệnh nhân đã có lịch khác cùng giờ,
  đều bị từ chối ở tầng dịch vụ.

Chi tiết đầy đủ nằm trong [docs/03-business-rules-use-cases.md](docs/03-business-rules-use-cases.md)
và [docs/04-appointment-lifecycle.md](docs/04-appointment-lifecycle.md).

## Chạy dự án

### Yêu cầu

Java 21, Maven, MySQL 8, Node.js 20 trở lên.

### 1. Cơ sở dữ liệu

```powershell
mysql -u root -p -e "CREATE DATABASE medical_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

Flyway tự tạo bảng và nạp dữ liệu mẫu khi backend khởi động lần đầu.

### 2. Biến môi trường

`DB_PASSWORD` và `JWT_SECRET` bắt buộc phải đặt qua biến môi trường. **Không đặt giá trị thật
vào mã nguồn, tài liệu hay commit.**

```powershell
$env:DB_PASSWORD = "<mật khẩu MySQL của bạn>"
$env:JWT_SECRET  = "<chuỗi bí mật đủ dài>"
```

### 3. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API chạy ở `http://localhost:8080`. Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Giao diện chạy ở `http://localhost:5173`.

Backend chỉ cho phép trình duyệt gọi từ `http://localhost:5173`. Nếu Vite nhảy sang cổng khác
(thường do cổng 5173 đã bị chiếm), trình duyệt sẽ bị CORS chặn và mọi request đều lỗi. Khi đó
hoặc giải phóng cổng 5173, hoặc khai báo cổng mới:

```powershell
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5174"
```

## Tài khoản demo

Migration `V4__seed_demo_users.sql` tạo sẵn các tài khoản dưới đây để một bản clone mới có thể
thử hết mọi vai trò. Nếu không có sẵn tài khoản ADMIN thì không tạo được bác sĩ, vì
`POST /api/v1/admin/doctors` yêu cầu vai trò `ADMIN`.

| Email | Vai trò |
|---|---|
| `admin@clinic.local` | ADMIN |
| `receptionist@clinic.local` | RECEPTIONIST |
| `doctor1@clinic.local` | DOCTOR |
| `doctor2@clinic.local` | DOCTOR |
| `patient@clinic.local` | PATIENT |
| `patient2@clinic.local` | PATIENT |
| `patient3@clinic.local` | PATIENT |

Mật khẩu chung: `Demo@12345`. **Đây là thông tin chỉ dùng để phát triển — phải đổi hoặc xóa
trước khi triển khai thật.**

`V5__seed_demo_clinical_data.sql` nạp thêm dữ liệu để màn hình không trống: hai bác sĩ kèm lịch
trực hàng tuần, một ca khám đã hoàn tất kèm bệnh án và đơn thuốc, một lịch hẹn sắp tới đang chờ
lễ tân xác nhận. `V6` bổ sung một lịch hẹn đã xác nhận và đã tới giờ, để thử được luồng khám
bệnh của bác sĩ ngay trên cơ sở dữ liệu mới.

### Đặt lại cơ sở dữ liệu

Xóa và tạo lại schema sẽ chạy lại toàn bộ migration từ đầu:

```powershell
mysql -u root -p -e "DROP DATABASE IF EXISTS medical_clinic; CREATE DATABASE medical_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

Tắt backend trước, rồi khởi động lại để Flyway dựng lại schema và nạp lại dữ liệu mẫu.

## Kiểm thử

```powershell
cd backend
.\mvnw.cmd test          # 151 test

cd ..\frontend
npm test                 # 48 test
npm run lint
npm run build
```

## Ghi chú kỹ thuật

**Làm mới token.** Access token hết hạn thì client tự gọi `/api/v1/auth/refresh`. Backend thu
hồi refresh token cũ mỗi lần cấp mới, nên hai request làm mới song song sẽ khiến cái thứ hai
thất bại. Client vì thế gộp chung một lần gọi duy nhất (`src/api/client.ts`).

**Phân trang.** Spring đánh số trang từ 0, Ant Design đánh số từ 1. Việc quy đổi gom về một chỗ
trong `src/lib/pagination.ts` để lỗi lệch một đơn vị không rải khắp màn hình.

**Khung giờ đã kín.** API chỉ trả các khung giờ còn trống. Giao diện dựng lại toàn bộ khung giờ
theo lịch trực rồi đánh dấu những khung thiếu là đã có người đặt (`src/lib/slots.ts`), nếu không
một ngày đông khách sẽ trông giống một ngày ít ca.

**Chia nhỏ gói.** Mọi trang đều nạp theo kiểu lazy qua `React.lazy`, khai báo tập trung ở
`src/pages/lazyPages.ts`.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [01-project-scope.md](docs/01-project-scope.md) | Phạm vi dự án |
| [02-actor-use-case-analysis.md](docs/02-actor-use-case-analysis.md) | Tác nhân và use case |
| [03-business-rules-use-cases.md](docs/03-business-rules-use-cases.md) | Quy tắc nghiệp vụ |
| [04-appointment-lifecycle.md](docs/04-appointment-lifecycle.md) | Vòng đời lịch hẹn |
| [05-domain-model-database-design.md](docs/05-domain-model-database-design.md) | Mô hình miền |
| [06-physical-database-schema-erd.md](docs/06-physical-database-schema-erd.md) | Lược đồ vật lý và ERD |
| [07-rest-api-design.md](docs/07-rest-api-design.md) | Thiết kế REST API |
| [08-ui-design-brief.md](docs/08-ui-design-brief.md) | Mô tả giao diện |

`CURRENT_STATUS.md` ghi lại trạng thái hiện tại của dự án.

## Phạm vi chưa làm

Những phần dưới đây cố ý nằm ngoài phạm vi, giao diện không hiển thị thứ hệ thống không có:
thanh toán và viện phí, bảo hiểm y tế, gửi thông báo qua email/SMS/Zalo, quản lý phòng khám và
giường bệnh, chỉ định và kết quả cận lâm sàng, sinh hiệu, mã ICD-10, kho dược và cấp phát thuốc,
nhật ký thao tác, và trạng thái bệnh nhân không đến khám (`NO_SHOW`).
