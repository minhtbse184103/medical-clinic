# 02 - Actor & Use Case Analysis

## 1. Mục tiêu

Tài liệu này xác định các actor chính trong hệ thống, quyền hạn của từng actor và danh sách Use Case thuộc phạm vi MVP.

Mục tiêu của bước này là trả lời rõ:

- Ai sử dụng hệ thống?
- Mỗi actor được phép làm gì?
- Mỗi actor không được phép làm gì?
- Các chức năng chính của hệ thống là gì?
- Những nghiệp vụ nào cần phân tích sâu ở bước tiếp theo?

---

# 2. Actors

Hệ thống MVP gồm 4 actor:

- ADMIN
- DOCTOR
- RECEPTIONIST
- PATIENT

---

# 3. Actor Responsibilities

## 3.1 ADMIN

### Trách nhiệm chính

ADMIN chịu trách nhiệm quản lý tài khoản nhân viên và cấu hình cơ bản của hệ thống.

### Được phép

- Đăng nhập hệ thống.
- Xem thông tin tài khoản của mình.
- Tạo tài khoản Doctor.
- Tạo tài khoản Receptionist.
- Xem danh sách nhân viên.
- Kích hoạt / vô hiệu hóa tài khoản nhân viên.
- Xem danh sách Doctor.
- Quản lý lịch làm việc của Doctor.
- Xem thông tin cơ bản của Patient khi cần cho mục đích quản trị.

### Không được phép trong MVP

- Không trực tiếp tạo Medical Record.
- Không trực tiếp kê Prescription.
- Không tự ý sửa nội dung Medical Record của Doctor.
- Không thực hiện nghiệp vụ khám bệnh.

### Ghi chú thiết kế

Không cho ADMIN can thiệp sâu vào hồ sơ khám giúp phân tách rõ quyền quản trị hệ thống và quyền chuyên môn y tế.

---

## 3.2 DOCTOR

### Trách nhiệm chính

DOCTOR chịu trách nhiệm khám bệnh, theo dõi lịch khám và tạo hồ sơ khám.

### Được phép

- Đăng nhập.
- Xem profile của mình.
- Xem lịch làm việc của mình.
- Xem danh sách Appointment của mình.
- Xem Appointment theo ngày.
- Xem thông tin Patient liên quan đến Appointment của mình.
- Xem lịch sử khám cần thiết của Patient.
- Đánh dấu Appointment là COMPLETED khi đã khám xong.
- Tạo Medical Record cho một Appointment hợp lệ.
- Tạo Prescription gắn với Medical Record.
- Xem các Medical Record do mình tạo.

### Không được phép

- Không tạo tài khoản nhân viên.
- Không xem Appointment của Doctor khác nếu không có nghiệp vụ đặc biệt.
- Không tạo Medical Record cho Appointment không thuộc mình.
- Không tạo Medical Record cho Patient chưa có Appointment hợp lệ.
- Không xem toàn bộ dữ liệu Patient không liên quan đến mình.
- Không thay đổi Role của User.

---

## 3.3 RECEPTIONIST

### Trách nhiệm chính

RECEPTIONIST quản lý lịch hẹn và hỗ trợ Patient trong quá trình đặt lịch.

### Được phép

- Đăng nhập.
- Xem profile của mình.
- Tìm kiếm Patient.
- Xem danh sách Doctor.
- Xem lịch làm việc của Doctor.
- Xem slot còn trống.
- Tạo Appointment cho Patient.
- Xem danh sách Appointment.
- Filter Appointment theo ngày, Doctor, Patient hoặc status.
- Confirm Appointment.
- Cancel Appointment theo business rule.

### Không được phép

- Không tạo Medical Record.
- Không kê Prescription.
- Không sửa diagnosis / treatment / notes của Medical Record.
- Không quản lý Role.
- Không tạo tài khoản Doctor hoặc Receptionist.

### Ghi chú thiết kế

RECEPTIONIST chỉ quản lý quy trình hành chính của lịch khám, không tham gia nghiệp vụ chuyên môn y tế.

---

## 3.4 PATIENT

### Trách nhiệm chính

PATIENT sử dụng hệ thống để tìm Doctor, đặt lịch và theo dõi lịch sử khám của chính mình.

### Được phép

- Tự đăng ký tài khoản.
- Đăng nhập.
- Xem profile của mình.
- Cập nhật một số thông tin profile của mình.
- Xem danh sách Doctor.
- Xem lịch làm việc của Doctor.
- Xem slot còn trống.
- Đặt Appointment.
- Xem các Appointment của chính mình.
- Hủy Appointment của chính mình nếu hợp lệ.
- Xem Medical Record của chính mình.
- Xem Prescription của chính mình.

### Không được phép

- Không xem Appointment của Patient khác.
- Không xem Medical Record của Patient khác.
- Không tạo Medical Record.
- Không tạo Prescription.
- Không tự Confirm hoặc Complete Appointment.
- Không tự thay đổi Role.
- Không tạo tài khoản Doctor / Receptionist / Admin.

---

# 4. Permission Matrix

| Chức năng | ADMIN | DOCTOR | RECEPTIONIST | PATIENT |
|---|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | ✓ |
| Patient self-register |  |  |  | ✓ |
| View own profile | ✓ | ✓ | ✓ | ✓ |
| Update own profile | Limited | Limited | Limited | ✓ |
| Create Doctor account | ✓ |  |  |  |
| Create Receptionist account | ✓ |  |  |  |
| Activate/deactivate staff account | ✓ |  |  |  |
| View Doctor list | ✓ | ✓ | ✓ | ✓ |
| Manage Doctor schedule | ✓ |  |  |  |
| View Doctor schedule | ✓ | ✓ | ✓ | ✓ |
| View available slots | ✓ | ✓ | ✓ | ✓ |
| Create Appointment |  |  | ✓ | ✓ |
| View all clinic appointments |  |  | ✓ |  |
| View own Doctor appointments |  | ✓ |  |  |
| View own Patient appointments |  |  |  | ✓ |
| Confirm Appointment |  |  | ✓ |  |
| Cancel Appointment |  | Limited | ✓ | ✓ |
| Complete Appointment |  | ✓ |  |  |
| Create Medical Record |  | ✓ |  |  |
| View relevant Medical Record | Limited | ✓ |  | ✓ |
| Create Prescription |  | ✓ |  |  |
| View Prescription | Limited | ✓ |  | ✓ |
| Manage Roles | ✓ |  |  |  |

> "Limited" nghĩa là chỉ được phép trong một số tình huống cụ thể, sẽ được mô tả bằng business rule ở bước sau.

---

# 5. MVP Use Case List

## Authentication

### UC-01 - Register Patient

Actor: PATIENT

Mục tiêu: Patient tự tạo tài khoản để sử dụng hệ thống.

---

### UC-02 - Login

Actor:
- ADMIN
- DOCTOR
- RECEPTIONIST
- PATIENT

Mục tiêu: Xác thực người dùng và cấp token truy cập.

---

### UC-03 - Refresh Access Token

Actor:
- ADMIN
- DOCTOR
- RECEPTIONIST
- PATIENT

Mục tiêu: Nhận access token mới khi access token hết hạn nhưng refresh token còn hợp lệ.

---

### UC-04 - Logout

Actor:
- ADMIN
- DOCTOR
- RECEPTIONIST
- PATIENT

Mục tiêu: Kết thúc phiên đăng nhập / vô hiệu hóa refresh token.

---

# User / Staff Management

### UC-05 - Create Doctor Account

Actor: ADMIN

Mục tiêu: Tạo tài khoản Doctor.

---

### UC-06 - Create Receptionist Account

Actor: ADMIN

Mục tiêu: Tạo tài khoản Receptionist.

---

### UC-07 - View Staff List

Actor: ADMIN

Mục tiêu: Xem và tìm kiếm danh sách nhân viên.

---

### UC-08 - Activate / Deactivate Staff Account

Actor: ADMIN

Mục tiêu: Khóa hoặc mở lại tài khoản nhân viên mà không xóa dữ liệu lịch sử.

---

# Patient

### UC-09 - View Own Profile

Actor: PATIENT

---

### UC-10 - Update Own Profile

Actor: PATIENT

---

### UC-11 - Search Patient

Actor: RECEPTIONIST

Mục tiêu: Tìm Patient để hỗ trợ tạo Appointment.

---

# Doctor

### UC-12 - View Doctor List

Actor:
- PATIENT
- RECEPTIONIST
- ADMIN

Mục tiêu: Xem danh sách Doctor đang hoạt động.

---

### UC-13 - View Doctor Detail

Actor:
- PATIENT
- RECEPTIONIST
- ADMIN

---

# Doctor Schedule

### UC-14 - Create Doctor Schedule

Actor: ADMIN

Mục tiêu: Thiết lập thời gian làm việc của Doctor.

---

### UC-15 - Update Doctor Schedule

Actor: ADMIN

---

### UC-16 - View Doctor Schedule

Actor:
- PATIENT
- RECEPTIONIST
- DOCTOR
- ADMIN

---

### UC-17 - View Available Appointment Slots

Actor:
- PATIENT
- RECEPTIONIST

Mục tiêu: Xác định các khung giờ còn có thể đặt.

---

# Appointment

### UC-18 - Book Appointment

Actor: PATIENT

Mục tiêu: Patient tự đặt lịch với Doctor.

---

### UC-19 - Create Appointment for Patient

Actor: RECEPTIONIST

Mục tiêu: Receptionist đặt lịch thay cho Patient.

---

### UC-20 - View Own Appointments

Actor: PATIENT

---

### UC-21 - View Doctor Appointments

Actor: DOCTOR

Mục tiêu: Doctor xem các Appointment thuộc mình.

---

### UC-22 - Manage Appointment List

Actor: RECEPTIONIST

Mục tiêu: Xem, phân trang, filter và tìm kiếm Appointment.

---

### UC-23 - Confirm Appointment

Actor: RECEPTIONIST

Mục tiêu: Chuyển Appointment từ PENDING sang CONFIRMED khi hợp lệ.

---

### UC-24 - Cancel Appointment by Patient

Actor: PATIENT

Mục tiêu: Hủy Appointment của chính mình khi business rule cho phép.

---

### UC-25 - Cancel Appointment by Receptionist

Actor: RECEPTIONIST

Mục tiêu: Hủy Appointment trong trường hợp hành chính.

---

### UC-26 - Complete Appointment

Actor: DOCTOR

Mục tiêu: Đánh dấu buổi khám đã hoàn thành.

---

# Medical Record

### UC-27 - Create Medical Record

Actor: DOCTOR

Mục tiêu: Tạo hồ sơ khám sau buổi khám hợp lệ.

---

### UC-28 - View Patient Medical History

Actor: DOCTOR

Mục tiêu: Xem lịch sử khám cần thiết của Patient phục vụ khám bệnh.

---

### UC-29 - View Own Medical Records

Actor: PATIENT

Mục tiêu: Patient xem lịch sử khám của chính mình.

---

# Medicine / Prescription

### UC-30 - View Medicine List

Actor: DOCTOR

Mục tiêu: Doctor chọn Medicine khi kê đơn.

---

### UC-31 - Create Prescription

Actor: DOCTOR

Mục tiêu: Tạo đơn thuốc gắn với Medical Record.

---

### UC-32 - View Own Prescription

Actor: PATIENT

Mục tiêu: Patient xem đơn thuốc của chính mình.

---

# 6. Important Business Rules Identified

Các rule dưới đây mới ở mức tổng quát. Chúng sẽ được phân tích chi tiết ở bước tiếp theo.

## Authentication

- Email/username phải unique.
- Password phải được hash, không lưu plain text.
- Tài khoản inactive không được đăng nhập.
- Patient chỉ có thể tự đăng ký với role PATIENT.
- Người dùng không được tự gửi role trong request register để trở thành ADMIN/DOCTOR.

## Doctor Schedule

- Doctor chỉ nhận Appointment trong thời gian làm việc.
- Schedule không được có khoảng thời gian không hợp lệ.
- Các lịch làm việc của cùng Doctor không được overlap ngoài chủ đích thiết kế.

## Appointment

- Không đặt lịch trong quá khứ.
- Doctor phải tồn tại và active.
- Patient phải tồn tại và active.
- Slot phải nằm trong giờ làm việc của Doctor.
- Không cho double booking cùng Doctor tại cùng slot.
- Database phải có constraint bảo vệ việc duplicate booking.
- PENDING có thể chuyển thành CONFIRMED hoặc CANCELLED.
- CONFIRMED có thể chuyển thành COMPLETED hoặc CANCELLED.
- COMPLETED không được quay lại PENDING.
- CANCELLED không được chuyển thành COMPLETED.
- Patient chỉ được thao tác trên Appointment của chính mình.
- Doctor chỉ được thao tác trên Appointment thuộc mình.

## Medical Record

- Chỉ Doctor được tạo.
- Doctor chỉ tạo record cho Appointment thuộc mình.
- Một Appointment chỉ nên sinh một Medical Record.
- Medical Record không được tạo cho Appointment CANCELLED.
- Medical Record phải giữ được lịch sử, không nên bị xóa tùy tiện.

## Prescription

- Prescription phải thuộc một Medical Record.
- Chỉ Doctor được kê đơn.
- Prescription Detail phải chứa Medicine hợp lệ.
- Patient chỉ được xem Prescription của chính mình.

---

# 7. Use Cases cần phân tích sâu trước khi thiết kế Database

Không cần viết specification chi tiết cho toàn bộ 32 use case ngay lập tức.

Nên ưu tiên các use case chứa nhiều business logic:

1. UC-01 - Register Patient
2. UC-02 - Login
3. UC-14 - Create Doctor Schedule
4. UC-17 - View Available Appointment Slots
5. UC-18 - Book Appointment
6. UC-19 - Create Appointment for Patient
7. UC-23 - Confirm Appointment
8. UC-24 - Cancel Appointment by Patient
9. UC-26 - Complete Appointment
10. UC-27 - Create Medical Record
11. UC-31 - Create Prescription

Đây là các use case ảnh hưởng trực tiếp tới:

- Entity
- Relationship
- Constraint
- Transaction
- Security
- REST API
- Testing

---

# 8. Review quyết định thiết kế

## Quyết định 1 - Không có NURSE trong MVP

Hợp lý.

Role Nurse chưa tạo thêm business flow đủ quan trọng để biện minh cho độ phức tạp tăng thêm.

---

## Quyết định 2 - ADMIN quản lý Doctor Schedule

Phù hợp cho MVP.

Trong hệ thống thật có thể Doctor tự khai báo lịch hoặc Receptionist quản lý, nhưng chọn ADMIN giúp quyền hạn đơn giản hơn trong version đầu.

Sau này có thể thay đổi thành:

- ADMIN cấu hình lịch mặc định.
- DOCTOR gửi yêu cầu thay đổi lịch.
- RECEPTIONIST xem nhưng không chỉnh.

Không cần cho MVP.

---

## Quyết định 3 - RECEPTIONIST Confirm Appointment

Hợp lý.

Nó tạo ra khác biệt rõ giữa:

Patient:
PENDING request

và

Receptionist:
CONFIRMED appointment

Đồng thời tạo business flow có status transition để luyện backend.

---

## Quyết định 4 - DOCTOR Complete Appointment

Hợp lý hơn việc Receptionist complete.

Doctor là người biết buổi khám thực sự đã diễn ra.

---

## Quyết định 5 - Medical Record chỉ do DOCTOR tạo

Đúng với scope hiện tại.

Giúp authorization rõ ràng và giảm nguy cơ dữ liệu y tế bị thay đổi bởi actor không phù hợp.

---

## Quyết định 6 - Không cho ADMIN sửa Medical Record

Nên giữ.

ADMIN là quản trị hệ thống, không phải actor nghiệp vụ y tế.

Nếu cần hỗ trợ kỹ thuật, nên xử lý bằng audit/process thay vì cấp quyền sửa toàn bộ.

---

## Quyết định 7 - Không phân tích chi tiết 32 Use Case cùng lúc

Rất quan trọng.

32 Use Case chỉ là catalog chức năng.

Ta chỉ cần specification sâu cho các use case ảnh hưởng đến database và business rules trước, nếu không tài liệu sẽ rất dài nhưng ít giá trị.

---

# 9. Kết luận

Actor và quyền MVP hiện tại hợp lý:

- ADMIN: quản trị tài khoản và Doctor Schedule.
- RECEPTIONIST: quản lý Appointment.
- DOCTOR: khám bệnh, Medical Record, Prescription.
- PATIENT: đặt lịch và xem dữ liệu của chính mình.

Core business flow đã rõ:

PATIENT
→ tìm Doctor
→ xem Schedule / Slot
→ Book Appointment
→ RECEPTIONIST Confirm
→ DOCTOR Complete
→ Medical Record
→ Prescription
→ PATIENT xem lịch sử khám

Tài liệu này đủ ổn để chuyển sang bước tiếp theo:

**Business Rule & Detailed Use Case Analysis**

Trong bước đó nên bắt đầu từ use case quan trọng nhất:

**UC-18 - Book Appointment**
