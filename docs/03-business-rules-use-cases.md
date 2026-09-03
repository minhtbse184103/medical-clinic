# 03 - Business Rules & Detailed Use Case Analysis

## 1. Mục tiêu

Tài liệu này phân tích chi tiết nghiệp vụ cốt lõi trước khi thiết kế database và API.

Use Case đầu tiên được phân tích sâu:

**UC-18 - Book Appointment**

Mục tiêu:
- Làm rõ business flow.
- Xác định business rules.
- Xác định edge cases.
- Xác định dữ liệu cần thiết.
- Xác định constraint cần có ở database.
- Xác định điểm cần transaction.
- Chuẩn bị cho ERD và REST API.

---

## 2. UC-18 - Book Appointment

### Use Case ID
UC-18

### Actor
PATIENT

### Mục tiêu
Patient đặt lịch khám với một Doctor tại ngày và khung giờ cụ thể.

---

## 3. Preconditions

1. Patient đã đăng nhập.
2. Tài khoản Patient đang ACTIVE.
3. Doctor tồn tại.
4. Doctor đang ACTIVE.
5. Doctor có lịch làm việc trong ngày được chọn.
6. Slot nằm trong lịch làm việc của Doctor.
7. Slot chưa bị Appointment khác chiếm.
8. Thời gian Appointment nằm trong tương lai.

---

## 4. Input dự kiến

Client gửi:

```text
doctorId
appointmentDate
startTime
reason
```

Không cho client tự gửi:

```text
patientId
endTime
status
createdAt
```

### Lý do

- `patientId`: lấy từ authenticated user, tránh giả mạo đặt lịch cho người khác.
- `status`: backend tự đặt là `PENDING`.
- `endTime`: backend tính theo slot duration.
- `createdAt`: backend quản lý.

MVP đề xuất slot cố định:

```text
30 phút / appointment
```

---

## 5. Main Flow

1. Patient đăng nhập.
2. Patient chọn Doctor.
3. Patient chọn ngày khám.
4. System lấy Doctor Schedule.
5. System sinh danh sách slot hợp lệ.
6. System loại bỏ slot đã được đặt.
7. Patient chọn slot.
8. Patient nhập lý do khám.
9. Patient gửi request.
10. Backend lấy Patient từ authentication context.
11. Kiểm tra Patient ACTIVE.
12. Kiểm tra Doctor tồn tại và ACTIVE.
13. Kiểm tra thời gian chưa qua.
14. Kiểm tra slot thuộc Doctor Schedule.
15. Kiểm tra xung đột lịch.
16. Tạo Appointment trong transaction.
17. Database kiểm tra unique constraint.
18. Appointment được lưu với status `PENDING`.
19. Transaction commit.
20. Trả Appointment response.

---

## 6. Postconditions

### Thành công

- Appointment được tạo.
- Appointment thuộc đúng Patient hiện tại.
- Appointment thuộc Doctor được chọn.
- Status là `PENDING`.
- Slot không thể bị double-book bởi Appointment khác.

### Thất bại

- Không được lưu dữ liệu dở dang.
- Transaction phải rollback nếu có lỗi.
- Client nhận error response phù hợp.

---

## 7. Appointment Status

```text
PENDING
CONFIRMED
COMPLETED
CANCELLED
```

### Transition hợp lệ

```text
PENDING -> CONFIRMED
PENDING -> CANCELLED

CONFIRMED -> COMPLETED
CONFIRMED -> CANCELLED
```

### Transition không hợp lệ

```text
COMPLETED -> PENDING
COMPLETED -> CONFIRMED
COMPLETED -> CANCELLED

CANCELLED -> PENDING
CANCELLED -> CONFIRMED
CANCELLED -> COMPLETED
```

`COMPLETED` và `CANCELLED` là terminal states trong MVP.

---

## 8. Business Rules

### BR-APT-01 - Patient phải authenticated

Chưa đăng nhập:

```text
401 UNAUTHORIZED
```

### BR-APT-02 - Patient phải ACTIVE

Tài khoản inactive không được đặt lịch.

### BR-APT-03 - Doctor phải tồn tại

```text
404 NOT FOUND
DOCTOR_NOT_FOUND
```

### BR-APT-04 - Doctor phải ACTIVE

```text
DOCTOR_NOT_AVAILABLE
```

### BR-APT-05 - Không đặt lịch trong quá khứ

Ngày + giờ đặt phải lớn hơn thời điểm hiện tại.

### BR-APT-06 - Slot phải thuộc lịch làm việc

Ví dụ Doctor làm:

```text
08:00 - 12:00
13:30 - 17:00
```

thì không được đặt 12:30 hoặc 18:00.

### BR-APT-07 - Slot duration cố định trong MVP

Đề xuất:

```text
30 phút
```

Giúp logic available-slot đơn giản và dễ bảo vệ khi phỏng vấn.

### BR-APT-08 - Không double booking Doctor

Một Doctor không được có hai Appointment cùng slot.

### BR-APT-09 - Patient không được đặt hai lịch cùng giờ

Ví dụ Patient không thể cùng lúc có:

```text
Doctor A: 10:00 - 10:30
Doctor B: 10:00 - 10:30
```

### BR-APT-10 - Reason là required

Đề xuất:

```text
Not blank
Max length: 500
```

### BR-APT-11 - Patient không tự Confirm

Khi tạo:

```text
status = PENDING
```

Frontend không được quyết định status.

### BR-APT-12 - Backend chỉ nhận doctorId

Không nhận nguyên Doctor entity từ client.

---

## 9. Concurrency - Double Booking

Tình huống:

```text
Doctor A
10:00 - 10:30
```

Patient A và Patient B cùng đặt gần như đồng thời.

Nếu chỉ làm:

```text
SELECT slot
-> thấy trống
-> INSERT
```

có thể xảy ra:

```text
Request A -> SELECT -> empty
Request B -> SELECT -> empty
Request A -> INSERT
Request B -> INSERT
```

Đây là race condition.

---

## 10. Giải pháp MVP

Dùng:

```text
@Transactional
+
Database Unique Constraint
+
Exception Handling
```

Constraint dự kiến:

```text
UNIQUE (
    doctor_id,
    appointment_date,
    start_time
)
```

Kịch bản:

```text
Request A -> INSERT SUCCESS
Request B -> UNIQUE CONSTRAINT VIOLATION
```

Backend map lỗi thành:

```text
409 CONFLICT
APPOINTMENT_SLOT_ALREADY_BOOKED
```

Message:

```text
Khung giờ này đã có người đặt.
```

---

## 11. Vì sao SELECT trước INSERT chưa đủ?

SELECT trước INSERT vẫn hữu ích để fail fast.

Nhưng hai transaction có thể cùng đọc trạng thái "slot trống" trước khi transaction đầu tiên commit.

Do đó database constraint mới là lớp bảo vệ cuối cùng.

---

## 12. Vì sao @Transactional chưa đủ?

`@Transactional` đảm bảo một nhóm thao tác commit hoặc rollback cùng nhau.

Nó không mặc định ngăn hai transaction khác nhau cùng đọc một slot đang trống.

```text
@Transactional != concurrency lock
```

---

## 13. Vì sao chưa dùng Pessimistic Lock?

MVP chưa cần.

`Unique Constraint + Transaction`:
- đơn giản,
- dễ hiểu,
- đảm bảo data integrity,
- phù hợp Fresher/Junior,
- tránh over-engineering.

Sau này mới nghiên cứu:
- Optimistic Lock
- Pessimistic Lock
- Isolation Level
- Redis Distributed Lock

---

## 14. Vấn đề CANCELLED Appointment

Nếu dùng:

```text
UNIQUE (doctor_id, appointment_date, start_time)
```

thì Appointment đã `CANCELLED` vẫn giữ unique key.

Kết quả: slot bị hủy không thể được đặt lại.

Đây là vấn đề cần xử lý ở bước Database Design.

### Các phương án

1. Xóa Appointment khi cancel  
   Không nên vì mất lịch sử.

2. Giữ CANCELLED và unique constraint đơn giản  
   Không thực tế nếu cần rebook.

3. Tạo bảng slot riêng  
   Rõ domain nhưng tăng độ phức tạp.

4. Dùng strategy cho active booking  
   Thực tế hơn nhưng cần thiết kế kỹ với MySQL.

### Quyết định hiện tại

**Chưa chốt vội.**

Ta sẽ quyết định khi thiết kế database để chọn phương án vừa thực tế vừa dễ giải thích khi phỏng vấn.

---

## 15. Alternative Flows

### Doctor không tồn tại

```text
404 NOT FOUND
DOCTOR_NOT_FOUND
```

### Doctor inactive

```text
400 BAD REQUEST
DOCTOR_NOT_AVAILABLE
```

### Slot ngoài lịch làm việc

```text
400 BAD REQUEST
INVALID_APPOINTMENT_SLOT
```

### Slot đã được đặt

```text
409 CONFLICT
APPOINTMENT_SLOT_ALREADY_BOOKED
```

### Appointment ở quá khứ

```text
400 BAD REQUEST
APPOINTMENT_TIME_IN_PAST
```

### Patient inactive

```text
403 FORBIDDEN
ACCOUNT_INACTIVE
```

### Patient đã có lịch cùng giờ

```text
409 CONFLICT
PATIENT_TIME_CONFLICT
```

---

## 16. Security Rules

- Patient ID lấy từ authentication context.
- Patient không thể sửa request để đặt cho người khác.
- Doctor ID phải được validate từ database.
- Role check phải thực hiện ở backend.
- Không dựa vào việc frontend ẩn/hiện button để bảo vệ quyền.

---

## 17. Transaction Boundary

Logical flow:

```text
BEGIN TRANSACTION

validate patient
validate doctor
validate schedule
check conflicts
insert appointment

COMMIT
```

Nếu lỗi:

```text
ROLLBACK
```

Validation trong transaction không thay thế database constraint.

---

## 18. Data phát hiện từ UC-18

Các domain cần thiết:

```text
User
Patient
Doctor
DoctorSchedule
Appointment
Role
```

### Appointment sơ bộ

```text
id
patient_id
doctor_id
appointment_date
start_time
end_time
status
reason
created_at
updated_at
```

Đây chưa phải schema cuối cùng.

Chưa chốt:
- SQL data type
- index
- cascade
- cancelledAt
- confirmedAt
- completedAt
- soft delete

---

## 19. Doctor Schedule - Quyết định chưa chốt

Cần chọn một trong các mô hình:

### Weekly recurring

```text
MONDAY
08:00 - 12:00
```

### Date-specific

```text
2026-09-10
08:00 - 12:00
```

### Hybrid

Lịch tuần mặc định + ngày nghỉ / override theo ngày.

Quyết định này sẽ được xử lý ở Database Design.

---

## 20. Câu hỏi phỏng vấn từ Use Case này

### Nếu hai người cùng đặt một slot thì sao?

- Application có thể check trước.
- Check trước không đủ vì race condition.
- Database constraint bảo vệ data integrity.
- Transaction rollback nếu insert thất bại.
- Backend map lỗi thành `409 Conflict`.

### @Transactional có ngăn hai request chạy cùng lúc không?

Không.

### Vì sao không dùng synchronized?

`synchronized` chỉ bảo vệ trong cùng JVM.

Nếu chạy nhiều instance, lock Java không còn đủ.

### Vì sao dùng 409 Conflict?

Request hợp lệ về format nhưng xung đột với trạng thái hiện tại của resource.

### Vì sao dùng DTO?

Để kiểm soát dữ liệu client được phép gửi và không expose Entity trực tiếp.

---

## 21. Review

UC-18 hiện đã thể hiện được:

- Authentication
- Authorization
- Business validation
- Doctor Schedule
- Transaction
- Race condition
- Database constraint
- HTTP status
- DTO design
- Security boundary

Đây nên là một trong các điểm mạnh nhất của project khi đi phỏng vấn.

---

## 22. Các quyết định chưa chốt

1. Doctor Schedule dùng weekly, date-specific hay hybrid.
2. Cách rebook slot sau khi Appointment bị CANCELLED.
3. Constraint chống Patient đặt trùng giờ.
4. Index cho Appointment.
5. Kiểu dữ liệu ngày/giờ trong MySQL.
6. Có lưu `cancelledAt`, `confirmedAt`, `completedAt` không.
7. Appointment có soft delete không.
8. Quan hệ User - Patient - Doctor.

Không nên chốt những điểm này trước khi thiết kế ERD.

---

## 23. Kết luận

Core flow:

```text
PATIENT
   |
Select Doctor
   |
Select Date
   |
View Available Slots
   |
Select Slot
   |
Book Appointment
   |
Validation
   |
Transaction
   |
Database Constraint
   |
PENDING Appointment
```

UC-18 đã đủ rõ để làm đầu vào cho các bước tiếp theo.

Trước khi vẽ ERD, nên phân tích tiếp vòng đời Appointment:

- UC-23 - Confirm Appointment
- UC-24 - Cancel Appointment
- UC-26 - Complete Appointment
