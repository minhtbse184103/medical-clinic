# 05 - Domain Model & Database Design

## 1. Mục tiêu

Bước này chuyển từ business analysis sang thiết kế domain và database.

Nguyên tắc:

```text
Business Rule
    ↓
Domain Model
    ↓
Relationship
    ↓
Database Constraint
    ↓
Index
    ↓
ERD
    ↓
JPA Entity
```

Không viết JPA Entity trước khi các quyết định chính trong tài liệu này được chốt.

---

# 2. Domain Model sơ bộ

Các domain chính của MVP:

```text
User
Patient
Doctor
DoctorSchedule
Appointment
MedicalRecord
Prescription
PrescriptionDetail
Medicine
```

`Role` có thể là enum thay vì table riêng trong MVP.

`Receptionist` chưa cần table/profile riêng nếu không có dữ liệu nghiệp vụ đặc thù.

---

# 3. Quyết định 1 - User / Patient / Doctor Model

Có ba hướng phổ biến.

## Option A - Một bảng User chứa tất cả field

Ví dụ:

```text
users
- id
- email
- password
- role
- full_name
- phone
- date_of_birth
- specialty
- license_number
- blood_type
...
```

### Nhược điểm

- Nhiều column nullable.
- Field của Doctor và Patient bị trộn.
- Khó mở rộng.
- Domain không rõ.

**Không khuyến nghị.**

---

## Option B - User + profile table riêng

```text
users
    |
    ├── patient_profiles
    └── doctor_profiles
```

`users` giữ thông tin authentication/account.

`patient_profiles` giữ dữ liệu Patient.

`doctor_profiles` giữ dữ liệu Doctor.

Receptionist chỉ cần `users.role = RECEPTIONIST`.

### Ưu điểm

- Separation of concern rõ.
- Ít nullable field.
- Phù hợp Spring Security.
- Dễ mở rộng.
- Dễ giải thích khi phỏng vấn.

**Khuyến nghị cho MVP.**

---

## Option C - JPA inheritance

Ví dụ:

```text
User
 ├── Patient
 ├── Doctor
 └── Receptionist
```

Dùng:

```text
@Inheritance
```

### Nhược điểm

- Mapping phức tạp hơn.
- Không mang lại lợi ích rõ cho project này.
- Dễ kéo project vào vấn đề inheritance strategy thay vì business.

**Không khuyến nghị cho MVP.**

---

# 4. Thiết kế User được đề xuất

## users

```text
id
email
password_hash
role
status
created_at
updated_at
```

Role:

```text
ADMIN
DOCTOR
RECEPTIONIST
PATIENT
```

Status:

```text
ACTIVE
INACTIVE
```

### Constraint

```text
PRIMARY KEY (id)
UNIQUE (email)
```

### Ghi chú

Không lưu password plain text.

Tên field trong Java có thể là:

```text
password
```

nhưng database thực tế chứa password hash.

---

# 5. Patient Profile

## patients

```text
id
user_id
full_name
phone
date_of_birth
gender
address
created_at
updated_at
```

### Relationship

```text
User 1 ---- 0..1 Patient
```

Patient account có đúng một Patient profile.

### Constraint

```text
PRIMARY KEY (id)
UNIQUE (user_id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

---

# 6. Doctor Profile

## doctors

```text
id
user_id
full_name
phone
specialty
license_number
bio
created_at
updated_at
```

### Relationship

```text
User 1 ---- 0..1 Doctor
```

### Constraint

```text
PRIMARY KEY (id)
UNIQUE (user_id)
UNIQUE (license_number)
FOREIGN KEY (user_id) REFERENCES users(id)
```

`license_number` có thể required trong project để tăng tính thực tế.

---

# 7. Receptionist có cần bảng riêng không?

MVP đề xuất:

**Không.**

Receptionist hiện chỉ cần:

- account,
- role,
- login,
- thao tác Appointment.

Không có dữ liệu nghiệp vụ đặc biệt như:

```text
department
shift
counter
employee profile
```

Do đó chỉ cần:

```text
users.role = RECEPTIONIST
```

Nếu sau này cần employee profile thì mới tách bảng.

---

# 8. Role nên là enum hay table?

## Option A - Enum

```text
ADMIN
DOCTOR
RECEPTIONIST
PATIENT
```

Ưu điểm:

- Đơn giản.
- Role cố định.
- Dễ dùng với Spring Security.
- Phù hợp MVP.

## Option B - roles table + user_roles

Cần khi:

- một user có nhiều role,
- role động,
- permission động,
- RBAC phức tạp.

MVP chưa cần.

### Quyết định

Dùng enum:

```text
role VARCHAR / ENUM-like application value
```

Trong Java:

```text
enum Role
```

---

# 9. Quyết định 2 - Doctor Schedule Model

Có ba phương án.

## Option A - Date-specific schedule

```text
doctor_id
schedule_date
start_time
end_time
```

Ví dụ phải tạo dữ liệu cho từng ngày.

### Nhược điểm

- Lặp dữ liệu.
- Doctor làm cố định thứ Hai đến thứ Sáu thì phải tạo rất nhiều row.

---

## Option B - Weekly recurring schedule

```text
doctor_id
day_of_week
start_time
end_time
```

Ví dụ:

```text
MONDAY 08:00 - 12:00
MONDAY 13:30 - 17:00
TUESDAY 08:00 - 12:00
```

### Ưu điểm

- Đơn giản.
- Phù hợp clinic.
- Ít dữ liệu.
- Dễ sinh available slot.

### Nhược điểm

Không thể hiện ngày nghỉ bất thường.

---

## Option C - Weekly schedule + override/time-off

```text
doctor_schedules
doctor_time_off
```

Đây là model thực tế hơn.

Nhưng thêm module/time-off.

---

# 10. Quyết định Schedule cho MVP

Chọn:

```text
Weekly recurring schedule
```

Không thêm `DoctorTimeOff` trong MVP đầu tiên.

### doctor_schedules

```text
id
doctor_id
day_of_week
start_time
end_time
created_at
updated_at
```

Một Doctor có thể có nhiều khoảng làm việc trong một ngày:

```text
MONDAY 08:00 - 12:00
MONDAY 13:30 - 17:00
```

---

# 11. Doctor Schedule Rules

## Rule 1

```text
start_time < end_time
```

## Rule 2

Không cho các schedule của cùng Doctor và cùng weekday overlap.

Không hợp lệ:

```text
08:00 - 12:00
11:00 - 14:00
```

Hợp lệ:

```text
08:00 - 12:00
13:30 - 17:00
```

## Rule 3

Slot duration của MVP:

```text
30 phút
```

Slot được sinh động từ schedule.

Không cần lưu sẵn:

```text
08:00
08:30
09:00
...
```

thành rows riêng.

---

# 12. Vì sao không tạo bảng AppointmentSlot?

Có thể làm:

```text
appointment_slots
```

và tạo trước mọi slot.

Nhưng MVP chưa cần vì:

- thêm table,
- phải generate slot trước,
- phải quản lý trạng thái slot,
- complexity tăng.

Ta có thể tính available slots bằng:

```text
DoctorSchedule
-
Appointments đã chiếm slot
```

---

# 13. Appointment Model

## appointments

Dữ liệu đề xuất:

```text
id
patient_id
doctor_id
appointment_date
start_time
end_time
status
reason

confirmed_at
cancelled_at
completed_at
cancel_reason

created_at
updated_at
```

Status:

```text
PENDING
CONFIRMED
COMPLETED
CANCELLED
```

---

# 14. Relationship của Appointment

```text
Patient 1 ---- N Appointment
Doctor  1 ---- N Appointment
```

Mỗi Appointment:

- thuộc một Patient,
- thuộc một Doctor.

---

# 15. Quyết định 3 - CANCELLED slot và rebooking

Business yêu cầu:

```text
Appointment cũ vẫn phải được giữ
```

nhưng:

```text
slot đã CANCELLED phải có thể đặt lại
```

Nếu dùng:

```text
UNIQUE (doctor_id, appointment_date, start_time)
```

thì không đáp ứng được cả hai.

---

# 16. Các phương án xử lý

## Option A - Xóa Appointment bị CANCELLED

Không chọn.

Mất lịch sử và audit.

---

## Option B - Không cho rebook cancelled slot

Không chọn.

Quá thiếu thực tế.

---

## Option C - Thêm generated column cho active booking

Ý tưởng MySQL:

```text
active_slot_key
```

Chỉ có giá trị khi status còn giữ slot.

Ví dụ:

```text
PENDING / CONFIRMED -> generated key
CANCELLED -> NULL
```

Unique index cho generated key.

### Ưu điểm

- Giữ history.
- Cho rebook.
- DB bảo vệ concurrency.

### Nhược điểm

- MySQL-specific.
- Khó hơn một chút để giải thích.
- Schema không còn hoàn toàn đơn giản.

---

## Option D - Có booking_slot_active flag

Ví dụ:

```text
slot_active
```

và unique:

```text
(doctor_id, appointment_date, start_time, slot_active)
```

### Vấn đề

Nếu `slot_active = false`, nhiều Appointment cancelled cùng slot cũng bị unique conflict nếu cùng bộ key.

Không giải quyết đẹp bằng boolean đơn giản.

---

## Option E - Tạo bảng current slot reservation riêng

Ví dụ:

```text
appointment_slot_reservations
- doctor_id
- appointment_date
- start_time
- appointment_id
```

Chỉ Appointment đang giữ slot mới có row.

Cancel:

```text
DELETE reservation row
```

Appointment history vẫn giữ nguyên.

### Ưu điểm

- Domain rõ.
- Unique constraint đơn giản.
- Rebook dễ.
- History Appointment vẫn còn.

### Nhược điểm

- Thêm table và transaction logic.
- Hơi nhiều cho MVP.

---

# 17. Khuyến nghị cho project

Có hai hướng đều chấp nhận được.

### Hướng đơn giản nhất khi code

Dùng MySQL generated column / functional uniqueness cho active slot.

### Hướng database trung lập và domain rõ

Dùng bảng reservation riêng.

Đối với project Fresher/Junior này, khuyến nghị:

**Dùng generated column strategy ở database, nhưng giữ application logic đơn giản.**

Lý do:

- Không phải tạo thêm một entity business khó hiểu.
- Vẫn giữ history.
- Vẫn rebook được.
- Vẫn có database-level concurrency protection.
- Có một technical point tốt để trình bày khi phỏng vấn.

Tuy nhiên SQL cụ thể sẽ chỉ viết sau khi chốt version MySQL.

---

# 18. Active Appointment là gì?

Appointment giữ slot khi status là:

```text
PENDING
CONFIRMED
```

Appointment không giữ slot khi:

```text
CANCELLED
```

`COMPLETED` là lịch sử đã xảy ra.

Với Appointment trong quá khứ, việc giữ unique key không gây vấn đề rebooking vì ngày + giờ đã khác tương lai.

Do đó generated key chủ yếu cần làm cho `CANCELLED` trở thành NULL.

---

# 19. Patient Time Conflict

Ngoài Doctor double booking, Patient cũng không nên có hai lịch cùng thời gian.

Có thể kiểm tra:

```text
patient_id
appointment_date
start_time
```

Tương tự, cancelled Appointment không nên block Patient.

MVP có hai lớp:

1. Application check.
2. Có thể thêm database protection tương tự nếu schema không quá phức tạp.

### Khuyến nghị

Ưu tiên DB constraint bắt buộc cho **Doctor slot**.

Patient time conflict trước mắt có thể dùng application validation.

Lý do:

Doctor double-book gây lỗi vận hành trực tiếp và concurrency cao hơn.

Không cần tăng schema complexity quá sớm.

---

# 20. Medical Record Model

## medical_records

```text
id
appointment_id
patient_id
doctor_id

symptoms
diagnosis
treatment
notes

created_at
updated_at
```

### Relationship

```text
Appointment 1 ---- 0..1 MedicalRecord
```

### Constraint

```text
UNIQUE (appointment_id)
```

---

# 21. Có cần patient_id và doctor_id trong MedicalRecord?

Về lý thuyết có thể suy ra qua Appointment.

Hai lựa chọn:

## Option A - Chỉ appointment_id

Ưu điểm:

- Không duplicate FK.

Nhược điểm:

- Query history phải JOIN Appointment.
- Domain record không có direct reference Patient/Doctor.

## Option B - appointment_id + patient_id + doctor_id

Ưu điểm:

- Query medical history rõ.
- MedicalRecord tự thể hiện owner/provider.

Nhược điểm:

- Có dữ liệu dư thừa cần giữ consistency.

### Khuyến nghị

MVP dùng:

```text
appointment_id
```

và quan hệ đến Appointment.

Khi cần Patient/Doctor:

```text
MedicalRecord -> Appointment -> Patient/Doctor
```

Giữ schema normalized hơn.

---

# 22. Medical Record đề xuất cuối

```text
id
appointment_id
symptoms
diagnosis
treatment
notes
created_at
updated_at
```

Constraint:

```text
UNIQUE (appointment_id)
FOREIGN KEY (appointment_id)
```

---

# 23. Medicine Model

## medicines

```text
id
name
unit
description
active
created_at
updated_at
```

MVP không làm:

- inventory,
- stock,
- batch,
- expiry,
- supplier.

Medicine chỉ là danh mục thuốc dùng khi kê đơn.

---

# 24. Prescription Model

## prescriptions

```text
id
medical_record_id
notes
created_at
updated_at
```

Relationship:

```text
MedicalRecord 1 ---- 0..1 Prescription
```

MVP có thể cho một MedicalRecord có tối đa một Prescription.

Constraint:

```text
UNIQUE (medical_record_id)
```

---

# 25. Prescription Detail

## prescription_details

```text
id
prescription_id
medicine_id

dosage
frequency
duration
instruction
quantity
```

Relationship:

```text
Prescription 1 ---- N PrescriptionDetail
Medicine     1 ---- N PrescriptionDetail
```

Đây là associative entity giữa Prescription và Medicine.

---

# 26. Vì sao không ManyToMany trực tiếp?

Không dùng:

```text
Prescription <-> Medicine @ManyToMany
```

vì relationship có dữ liệu riêng:

```text
dosage
frequency
duration
quantity
instruction
```

Do đó cần entity/table:

```text
PrescriptionDetail
```

Đây là điểm phỏng vấn quan trọng.

---

# 27. Entity List sau review

Domain Model MVP đề xuất:

```text
User
Patient
Doctor
DoctorSchedule
Appointment
MedicalRecord
Medicine
Prescription
PrescriptionDetail
```

Enum:

```text
Role
UserStatus
AppointmentStatus
Gender
DayOfWeek
```

`Receptionist` không cần entity riêng.

---

# 28. Relationship tổng thể

```text
User
 ├── 0..1 Patient
 └── 0..1 Doctor

Doctor
 ├── 1..N DoctorSchedule
 └── 1..N Appointment

Patient
 └── 1..N Appointment

Appointment
 └── 0..1 MedicalRecord

MedicalRecord
 └── 0..1 Prescription

Prescription
 └── 1..N PrescriptionDetail

Medicine
 └── 1..N PrescriptionDetail
```

---

# 29. Foreign Keys sơ bộ

```text
patients.user_id -> users.id

doctors.user_id -> users.id

doctor_schedules.doctor_id -> doctors.id

appointments.patient_id -> patients.id
appointments.doctor_id -> doctors.id

medical_records.appointment_id -> appointments.id

prescriptions.medical_record_id -> medical_records.id

prescription_details.prescription_id -> prescriptions.id
prescription_details.medicine_id -> medicines.id
```

---

# 30. Delete Strategy

Không nên cascade delete dữ liệu medical/business history một cách tùy tiện.

Ví dụ:

```text
DELETE Doctor
```

không được làm mất:

- Appointment cũ,
- MedicalRecord,
- Prescription.

### MVP Recommendation

User/Doctor/Patient nên deactivate thay vì hard delete.

Dữ liệu lịch sử không hard delete.

Medicine có thể dùng:

```text
active = false
```

thay vì xóa nếu đã từng được kê đơn.

---

# 31. Cascade trong JPA

Không chọn:

```text
CascadeType.ALL
```

một cách mặc định.

Cascade phải dựa trên lifecycle thực tế.

Ví dụ PrescriptionDetail là child thực sự của Prescription nên có thể cân nhắc cascade persist/remove.

Nhưng:

```text
Doctor -> Appointment
Patient -> Appointment
```

không được cascade remove.

---

# 32. Unique Constraints đề xuất

```text
users.email

patients.user_id

doctors.user_id
doctors.license_number

medical_records.appointment_id

prescriptions.medical_record_id
```

Appointment cần unique strategy riêng cho active doctor slot.

---

# 33. Index Strategy sơ bộ

Không index mọi column.

Index theo query/use case.

## Appointment

Các query phổ biến:

```text
Doctor xem lịch theo ngày
Patient xem lịch của mình
Receptionist lọc theo ngày/status/doctor
```

Index gợi ý:

```text
(doctor_id, appointment_date)
(patient_id, appointment_date)
(appointment_date, status)
```

Có thể cần thêm unique/index cho active slot.

---

# 34. Doctor Schedule Index

Query phổ biến:

```text
doctor_id + day_of_week
```

Index:

```text
(doctor_id, day_of_week)
```

---

# 35. Medical History Query

Patient history thường đi:

```text
Patient
-> Appointments
-> MedicalRecord
```

Index trên:

```text
appointments(patient_id, appointment_date)
```

đã giúp đáng kể.

Không cần index mọi text field như:

```text
diagnosis
symptoms
notes
```

trong MVP.

---

# 36. ERD dạng text

```text
USERS
  1
  |
  | 0..1
  +---------- PATIENTS
  |
  | 0..1
  +---------- DOCTORS
                  |
                  | 1..N
                  +---------- DOCTOR_SCHEDULES
                  |
                  | 1..N
                  v

PATIENTS 1 ---- N APPOINTMENTS N ---- 1 DOCTORS
                        |
                        | 0..1
                        v
                 MEDICAL_RECORDS
                        |
                        | 0..1
                        v
                  PRESCRIPTIONS
                        |
                        | 1..N
                        v
              PRESCRIPTION_DETAILS
                        |
                        | N..1
                        v
                    MEDICINES
```

---

# 37. Các quyết định đã chốt

1. Dùng layered monolith.
2. `User` tách khỏi `Patient` và `Doctor` profile.
3. `Receptionist` không có table riêng.
4. Role dùng enum trong MVP.
5. Doctor Schedule dùng weekly recurring schedule.
6. Slot 30 phút và sinh động, không lưu slot table.
7. Appointment giữ lịch sử khi CANCELLED.
8. Cancelled slot phải có thể rebook.
9. Khuyến nghị dùng DB active-slot uniqueness strategy cho Appointment.
10. Một Appointment tối đa một MedicalRecord.
11. Create MedicalRecord + Complete Appointment cùng transaction.
12. Một MedicalRecord tối đa một Prescription trong MVP.
13. PrescriptionDetail là entity riêng, không dùng ManyToMany trực tiếp.
14. Không hard delete medical history.
15. Không dùng CascadeType.ALL tùy tiện.

---

# 38. Những điểm còn cần chốt trước khi code

## 1. MySQL version

Cần biết version để viết generated-column/unique strategy chính xác.

## 2. Date/time type

Cần quyết định:

```text
DATE + TIME
```

hay:

```text
DATETIME
```

cho Appointment.

## 3. Doctor Schedule overlap constraint

Database khó enforce interval overlap bằng unique constraint đơn giản.

Application layer sẽ chịu trách nhiệm validation chính.

## 4. Cancellation actor

Có thể thêm:

```text
cancelled_by_user_id
```

để audit.

Khuyến nghị: **nên thêm** vì Patient và Receptionist đều có thể cancel.

---

# 39. Recommendation trước ERD cuối

Appointment nên bổ sung:

```text
cancelled_by_user_id
```

nullable.

Lý do:

- Biết ai đã hủy.
- Không cần thêm status history table.
- Hữu ích khi debug/audit.
- Chi phí schema thấp.

Relationship:

```text
appointments.cancelled_by_user_id -> users.id
```

---

# 40. Appointment Schema phiên bản đề xuất

```text
appointments

id
patient_id
doctor_id

appointment_date
start_time
end_time

status
reason

confirmed_at
cancelled_at
cancelled_by_user_id
cancel_reason
completed_at

created_at
updated_at
```

Đây là model đủ tốt để sang thiết kế SQL chi tiết.

---

# 41. Bước tiếp theo

Bước tiếp theo là:

# 06 - Physical Database Schema & ERD

Ta sẽ chốt:

1. Tên table/column chính thức.
2. MySQL data types.
3. PK/FK.
4. NOT NULL.
5. UNIQUE.
6. CHECK/business constraints phù hợp.
7. Index.
8. Active-slot concurrency constraint.
9. SQL DDL bản đầu.
10. ERD hoàn chỉnh.

Sau bước 06 mới bắt đầu tạo Spring Boot project và JPA Entity.
