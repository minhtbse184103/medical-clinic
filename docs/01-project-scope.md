# Medical Clinic Management System

## 1. Project Overview

**Tên tiếng Việt:** Hệ thống quản lý phòng khám  
**Tên tiếng Anh:** Medical Clinic Management System

Đây là project cá nhân được xây dựng nhằm mô phỏng một hệ thống quản lý phòng khám có nghiệp vụ thực tế, tập trung vào Backend với Java và Spring Boot.

Project hướng tới việc thể hiện các kiến thức quan trọng của một Java Backend Developer Fresher/Junior như:

- REST API
- Spring Boot
- Spring Security
- JWT Authentication
- Role-based Authorization
- JPA/Hibernate
- Database Design
- Transaction
- Validation
- Exception Handling
- Pagination / Filtering / Sorting
- Unit Test / Integration Test
- Docker

Mục tiêu chính của phiên bản đầu tiên là xây dựng một luồng nghiệp vụ hoàn chỉnh từ lúc bệnh nhân tìm bác sĩ, đặt lịch khám, được xác nhận lịch, bác sĩ khám bệnh, tạo hồ sơ khám và kê đơn thuốc.

---

## 2. Project Goals

Project được xây dựng để:

1. Đưa vào CV khi ứng tuyển Java Backend / Spring Boot Fresher.
2. Dùng làm project để trình bày và bảo vệ trong phỏng vấn.
3. Thể hiện khả năng phân tích nghiệp vụ thay vì chỉ thực hiện CRUD đơn giản.
4. Thể hiện khả năng thiết kế Database, REST API và xử lý transaction.
5. Thực hành Spring Security và phân quyền theo role.
6. Thực hành xử lý concurrency trong nghiệp vụ đặt lịch khám.
7. Tạo nền tảng để sau này có thể mở rộng cho môi trường sử dụng tiếng Việt, tiếng Nhật và tiếng Anh.

---

## 3. Actors

Phiên bản MVP có 4 actor chính:

### 3.1 ADMIN

Quản trị hệ thống và tài khoản nhân viên.

### 3.2 DOCTOR

Bác sĩ thực hiện khám bệnh, theo dõi lịch khám và tạo hồ sơ y tế.

### 3.3 RECEPTIONIST

Nhân viên lễ tân hỗ trợ quản lý và xác nhận lịch khám.

### 3.4 PATIENT

Bệnh nhân sử dụng hệ thống để tìm bác sĩ, đặt lịch và theo dõi lịch sử khám bệnh.

---

## 4. MVP Functional Scope

### 4.1 Authentication & Authorization

- Patient có thể đăng ký tài khoản.
- User có thể đăng nhập.
- Hệ thống sử dụng JWT để xác thực request.
- Hỗ trợ Refresh Token.
- User có thể logout.
- Password được hash trước khi lưu vào database.
- API được phân quyền theo role.

### 4.2 Admin

ADMIN có thể:

- Tạo tài khoản Doctor.
- Tạo tài khoản Receptionist.
- Xem danh sách tài khoản trong hệ thống.
- Kích hoạt hoặc vô hiệu hóa tài khoản.
- Quản lý thông tin cơ bản của Doctor.

### 4.3 Patient

PATIENT có thể:

- Xem profile cá nhân.
- Cập nhật thông tin cá nhân cơ bản.
- Xem danh sách Doctor.
- Xem thông tin Doctor.
- Xem các khung giờ khám còn trống của Doctor.
- Đặt lịch khám.
- Xem danh sách lịch khám của bản thân.
- Xem chi tiết lịch khám.
- Hủy lịch khám khi hợp lệ.
- Xem lịch sử khám bệnh của bản thân.
- Xem Medical Record thuộc về bản thân.
- Xem Prescription thuộc về bản thân.

### 4.4 Doctor

DOCTOR có thể:

- Xem profile cá nhân.
- Xem lịch làm việc.
- Xem danh sách appointment của bản thân.
- Xem appointment theo ngày.
- Xem thông tin bệnh nhân liên quan đến appointment.
- Thực hiện và hoàn thành buổi khám.
- Tạo Medical Record cho appointment hợp lệ.
- Tạo Prescription cho Medical Record.

### 4.5 Receptionist

RECEPTIONIST có thể:

- Xem danh sách appointment.
- Tìm kiếm / lọc appointment theo ngày, Doctor hoặc trạng thái.
- Tạo appointment thay cho Patient.
- Xác nhận appointment.
- Hủy appointment khi hợp lệ.

### 4.6 Doctor Schedule

Hệ thống quản lý lịch làm việc cơ bản của Doctor.

Bao gồm:

- Ngày làm việc trong tuần.
- Thời gian bắt đầu làm việc.
- Thời gian kết thúc làm việc.
- Các available slot được xác định dựa trên lịch làm việc và appointment đã tồn tại.

Patient chỉ được đặt appointment trong thời gian Doctor làm việc.

### 4.7 Appointment

Appointment là module nghiệp vụ chính của MVP.

Thông tin dự kiến:

- id
- patient_id
- doctor_id
- appointment_date
- start_time
- end_time
- status
- reason
- created_at
- updated_at

Các trạng thái ban đầu:

- PENDING
- CONFIRMED
- COMPLETED
- CANCELLED

Business rules chính:

- Không được đặt lịch trong quá khứ.
- Không được đặt ngoài thời gian làm việc của Doctor.
- Không được đặt một slot đã có appointment hợp lệ khác sử dụng.
- Không được hoàn thành appointment đã bị CANCELLED.
- Không được hủy appointment đã COMPLETED.
- Appointment phải tuân thủ quy tắc chuyển trạng thái hợp lệ.

Để hạn chế duplicate booking khi có request đồng thời, database sẽ có Unique Constraint tối thiểu trên:

`(doctor_id, appointment_date, start_time)`

Kết hợp với transaction và exception handling ở tầng backend.

### 4.8 Medical Record

Medical Record được tạo sau khi Doctor thực hiện khám bệnh.

Thông tin dự kiến:

- id
- patient_id
- doctor_id
- appointment_id
- symptoms
- diagnosis
- treatment
- notes
- created_at
- updated_at

Business rules chính:

- Chỉ Doctor phù hợp với appointment được phép tạo Medical Record.
- Một Medical Record phải liên kết với một appointment hợp lệ.
- Patient chỉ được xem Medical Record của chính mình.

### 4.9 Prescription

Doctor có thể tạo Prescription dựa trên Medical Record.

Các entity dự kiến:

- Prescription
- PrescriptionDetail
- Medicine

PrescriptionDetail có thể bao gồm:

- medicine
- dosage
- frequency
- duration
- instruction

Phiên bản MVP chỉ quản lý thông tin thuốc phục vụ kê đơn, chưa quản lý tồn kho thuốc.

---

## 5. Core Modules

Các module chính của MVP:

1. Authentication
2. User / Role
3. Patient
4. Doctor
5. Doctor Schedule
6. Appointment
7. Medical Record
8. Medicine
9. Prescription

---

## 6. Core Business Flow

Luồng nghiệp vụ chính:

```text
Patient
   ↓
Find Doctor
   ↓
View Available Slots
   ↓
Book Appointment
   ↓
Appointment: PENDING
   ↓
Receptionist confirms appointment
   ↓
Appointment: CONFIRMED
   ↓
Doctor examines patient
   ↓
Appointment: COMPLETED
   ↓
Medical Record
   ↓
Prescription
```

Một số nhánh nghiệp vụ:

```text
PENDING → CANCELLED
CONFIRMED → CANCELLED
```

Các transition không hợp lệ phải bị từ chối bởi business logic.

---

## 7. Non-Functional Requirements

Phiên bản MVP hướng tới các yêu cầu phi chức năng sau:

### Security

- Password không được lưu dưới dạng plain text.
- Các protected API yêu cầu authentication.
- Authorization dựa trên Role.
- Patient không được truy cập dữ liệu y tế của Patient khác.

### Data Integrity

- Sử dụng Primary Key và Foreign Key.
- Sử dụng Unique Constraint cho các dữ liệu cần chống trùng.
- Sử dụng Transaction cho các nghiệp vụ cần đảm bảo tính toàn vẹn.

### API Quality

- REST API sử dụng HTTP method phù hợp.
- Sử dụng HTTP status code hợp lý.
- Request được validate.
- Có Global Exception Handling.
- API danh sách hỗ trợ pagination khi phù hợp.

### Maintainability

- Không trả trực tiếp Entity ra API.
- Sử dụng DTO cho request / response.
- Ưu tiên Constructor Injection.
- Code chia rõ controller / service / repository và các package hỗ trợ.

### Documentation

- API được tài liệu hóa bằng Swagger / OpenAPI.
- README mô tả kiến trúc, ERD, business flow và cách chạy project.

### Testing

- Có Unit Test cho business logic quan trọng.
- Có Integration Test cho các flow quan trọng khi phù hợp.

---

## 8. Out of Scope for MVP

Các chức năng sau chưa nằm trong MVP:

- NURSE role.
- Real payment gateway (VNPay / Stripe / PayPal / MoMo).
- Invoice / Payment module hoàn chỉnh.
- Redis.
- Distributed Lock.
- Kafka / Message Queue.
- Microservices.
- Kubernetes.
- Medicine inventory.
- Supplier management.
- Drug batch / expiration management.
- Insurance management.
- Laboratory management.
- Complex hospital room / bed management.
- OAuth2 / Google Login.
- Two-Factor Authentication.
- Advanced Forgot Password flow.
- Email / SMS notification.
- Japanese / English UI trong giai đoạn đầu.
- Advanced React frontend.

Những chức năng này có thể được xem xét ở các version sau nếu core MVP đã ổn định.

---

## 9. Planned Technology Stack

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- JWT

### Database

- MySQL

### Documentation

- Swagger / OpenAPI

### Testing

- JUnit
- Mockito

### Environment / Deployment

- Docker
- Docker Compose

### Optional Future Technologies

- Redis
- React

---

## 10. Initial Package Structure Direction

```text
com.example.medical
├── controller
├── service
├── repository
├── entity
├── dto
├── mapper
├── exception
├── security
├── config
└── common
```

Đây chỉ là định hướng ban đầu. Package structure có thể được điều chỉnh khi domain và use case đã được phân tích rõ hơn.

---

## 11. Internationalization Direction

Phiên bản MVP sử dụng tiếng Việt.

Business logic không nên phụ thuộc trực tiếp vào message tiếng Việt hard-code nếu có thể tránh được.

Trong version sau có thể bổ sung:

```text
messages_vi.properties
messages_ja.properties
messages_en.properties
```

Frontend sau này có thể hỗ trợ chuyển đổi:

- Tiếng Việt
- 日本語
- English

Internationalization không phải yêu cầu bắt buộc của MVP.

---

## 12. MVP Completion Criteria

MVP được xem là hoàn thành khi có thể demo được flow sau:

1. Patient đăng ký và đăng nhập.
2. Admin tạo Doctor và Receptionist.
3. Doctor có lịch làm việc.
4. Patient xem Doctor và available slot.
5. Patient đặt appointment hợp lệ.
6. Hệ thống từ chối duplicate booking.
7. Receptionist xác nhận appointment.
8. Doctor xem appointment và thực hiện khám.
9. Doctor tạo Medical Record.
10. Doctor tạo Prescription.
11. Patient xem lịch sử appointment và Medical Record của chính mình.
12. API được bảo vệ đúng theo role.
13. Các lỗi business phổ biến được xử lý bằng response phù hợp.
14. Các API chính có Swagger documentation.
15. Project có test cho các business rule quan trọng.
16. Project có thể chạy bằng Docker / Docker Compose cùng MySQL.

---

## 13. Future Versions

### Version 2

- Invoice
- Payment status
- Forgot Password
- Email notification
- Doctor time-off
- Appointment reminder
- Advanced filtering
- Audit log

### Version 3

- Redis caching
- Nâng cao concurrency / locking
- Internationalization Việt / Nhật / Anh
- React frontend hoàn chỉnh
- Deployment production-like
- Monitoring

---

## 14. Current Design Principle

Project ưu tiên:

- Business logic rõ ràng.
- Database đúng và có constraint phù hợp.
- Security dễ hiểu và có thể giải thích.
- Code clean.
- Tránh over-engineering.
- Không thêm công nghệ nếu chưa có bài toán thực tế cần giải quyết.

Mục tiêu không phải xây dựng một hệ thống bệnh viện production hoàn chỉnh mà là xây dựng một backend portfolio project đủ thực tế để thể hiện năng lực Java / Spring Boot của Fresher/Junior.
