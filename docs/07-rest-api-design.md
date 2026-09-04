# 07 - REST API Design

## 1. Mục tiêu

Thiết kế API contract trước khi bắt đầu code Spring Boot.

Mục tiêu:
- Chốt endpoint.
- Chốt actor được phép gọi.
- Chốt request / response DTO.
- Chốt validation.
- Chốt HTTP status.
- Chốt error response format.
- Chốt pagination / filter / sort.
- Giữ API rõ nghĩa, không biến mọi thứ thành CRUD chung chung.

Base URL đề xuất:

```text
/api/v1
```

---

# 2. Nguyên tắc thiết kế API

## 2.1 Dùng noun cho resource

Tốt:

```text
GET /api/v1/doctors
GET /api/v1/appointments
```

Không nên:

```text
GET /api/v1/getDoctors
```

## 2.2 Business action nên rõ nghĩa

Với state transition, không dùng endpoint generic kiểu:

```text
PATCH /appointments/{id}
{ "status": "CONFIRMED" }
```

Khuyến nghị:

```text
POST /appointments/{id}/confirm
POST /appointments/{id}/cancel
```

Lý do:
- rõ business intent;
- dễ authorization;
- dễ validation status transition;
- client không được tự gán status tùy ý.

## 2.3 Không expose JPA Entity trực tiếp

Controller dùng DTO.

```text
Request DTO -> Service -> Entity
Entity -> Response DTO
```

---

# 3. Response convention

Không bắt buộc bọc mọi response bằng một wrapper chung.

## 3.1 Successful response policy

Mọi endpoint thành công phải trả response body bằng response DTO riêng để client/frontend có dữ liệu hiển thị hoặc dùng cho bước tiếp theo.

Ngoại lệ duy nhất là endpoint được chốt rõ ràng trả:

```text
204 No Content
```

Response DTO:
- không expose JPA Entity;
- không chứa password, password hash, refresh token nội bộ hoặc dữ liệu nhạy cảm khác;
- chỉ chứa dữ liệu client được phép nhận;
- có tên theo use case, ví dụ `RegisterPatientResponse`, `PatientProfileResponse`, `AppointmentResponse`.

Với các endpoint chưa có JSON response cụ thể trong tài liệu này, cần chốt response DTO trong tài liệu trước khi implement controller.

Ví dụ thành công:

```json
{
  "id": 101,
  "doctorId": 5,
  "appointmentDate": "2026-09-10",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "status": "PENDING",
  "reason": "Đau đầu kéo dài"
}
```

Với pagination có thể dùng cấu trúc:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

---

# 4. Error Response Format

Khuyến nghị một format thống nhất:

```json
{
  "timestamp": "2026-09-03T09:30:00",
  "status": 409,
  "error": "Conflict",
  "code": "APPOINTMENT_SLOT_ALREADY_BOOKED",
  "message": "Khung giờ này đã có người đặt.",
  "path": "/api/v1/appointments"
}
```

Validation error:

```json
{
  "timestamp": "2026-09-03T09:30:00",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ.",
  "path": "/api/v1/appointments",
  "fieldErrors": {
    "reason": "Reason must not be blank",
    "appointmentDate": "Appointment date is required"
  }
}
```

---

# 5. Authentication APIs

## UC-01 - Register Patient

```text
POST /api/v1/auth/register
```

Actor:

```text
PUBLIC
```

Request:

```json
{
  "email": "patient@example.com",
  "password": "Password123!",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "dateOfBirth": "2002-05-10",
  "gender": "MALE",
  "address": "Ho Chi Minh City"
}
```

Validation gợi ý:
- email: required + valid email.
- password: required, minimum 8 ký tự.
- fullName: required.
- phone: optional.
- dateOfBirth: không được ở tương lai.

Response:

```text
201 CREATED
```

Response body: `PrescriptionResponse`

```json
{
  "prescriptionId": 20,
  "medicalRecordId": 10,
  "notes": "After meals",
  "details": [
    {
      "medicineId": 1,
      "dosage": "1 tablet",
      "frequency": "twice daily",
      "duration": "5 days",
      "quantity": 10,
      "instruction": "After meals"
    }
  ],
  "createdAt": "2026-09-10T09:00:00"
}
```

Errors:

```text
403 DOCTOR_APPOINTMENT_ACCESS_FORBIDDEN
409 PRESCRIPTION_ALREADY_EXISTS
409 MEDICINE_NOT_AVAILABLE
```

Response body: `RegisterPatientResponse`

```json
{
  "userId": 1,
  "patientId": 1,
  "email": "patient@example.com",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "dateOfBirth": "2002-05-10",
  "gender": "MALE",
  "address": "Ho Chi Minh City",
  "status": "ACTIVE",
  "createdAt": "2026-09-03T12:30:00"
}
```

Không trả password hoặc password hash.

---

## Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "patient@example.com",
  "password": "Password123!"
}
```

Response:

Response body: `LoginResponse`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Status:

```text
200 OK
401 UNAUTHORIZED
403 FORBIDDEN (account inactive)
```

---

## Refresh Token

```text
POST /api/v1/auth/refresh
```

Request:

```json
{
  "refreshToken": "..."
}
```

Response:

```text
200 OK
```

Response body: `MedicalRecordResponse`

```json
{
  "medicalRecordId": 55,
  "appointmentId": 101,
  "symptoms": "Fever",
  "diagnosis": "Flu",
  "treatment": "Rest",
  "notes": "Observe",
  "createdAt": "2026-09-10T09:00:00"
}
```

Errors:

```text
404 APPOINTMENT_NOT_FOUND
403 DOCTOR_APPOINTMENT_ACCESS_FORBIDDEN
409 INVALID_APPOINTMENT_STATUS_TRANSITION
400 APPOINTMENT_TIME_NOT_REACHED
409 MEDICAL_RECORD_ALREADY_EXISTS
```

Response body: `LoginResponse`

`RefreshTokenRequest` chỉ chứa refresh token. Refresh token hợp lệ cấp một cặp access token và refresh token mới.

Errors:

```text
401 INVALID_REFRESH_TOKEN
403 ACCOUNT_INACTIVE
```

---

## Logout

```text
POST /api/v1/auth/logout
```

Request: `RefreshTokenRequest`

```json
{
  "refreshToken": "..."
}
```

Response: `204 NO CONTENT`

Server lưu chỉ `jti` của refresh token trong database, không lưu token thô. Logout thu hồi refresh token đó; endpoint idempotent nên token đã revoke hoặc đã hết hạn vẫn trả `204`.

Access token vẫn stateless, do đó có thể còn sử dụng cho đến khi hết hạn (tối đa 15 phút). Frontend phải xóa cả access token và refresh token cục bộ sau khi logout.

---

## JWT policy

- Login trả `LoginResponse` gồm access token và refresh token.
- Access token có thời hạn `900` giây (15 phút).
- Refresh token có thời hạn `604800` giây (7 ngày).
- JWT signing secret chỉ lấy từ environment variable `JWT_SECRET`, ở dạng Base64 của ít nhất 32 random bytes; không ghi secret thật vào source code, `application.yml`, tài liệu hoặc commit.
- Protected endpoint lấy user hiện tại từ JWT security context, không nhận `userId` từ client.
- Refresh token mang `jti`; server lưu `jti`, user và expiry trong database. Refresh token được rotate: token cũ bị xóa và token mới được lưu trong cùng transaction.

---

# 6. Admin - Staff APIs

## Create Doctor

```text
POST /api/v1/admin/doctors
```

Role:

```text
ADMIN
```

Request:

```json
{
  "email": "doctor@example.com",
  "temporaryPassword": "Temp123!",
  "fullName": "Dr. Tran B",
  "phone": "0900000000",
  "specialty": "Internal Medicine",
  "licenseNumber": "VN-DOC-001",
  "bio": "..."
}
```

Response:

```text
201 CREATED
```

Response body: `CreateDoctorResponse`

```json
{
  "userId": 2,
  "doctorId": 1,
  "email": "doctor@example.com",
  "fullName": "Dr. Tran B",
  "phone": "0900000000",
  "specialty": "Internal Medicine",
  "licenseNumber": "VN-DOC-001",
  "bio": "...",
  "status": "ACTIVE",
  "createdAt": "2026-09-03T14:30:00"
}
```

Không trả `temporaryPassword` hoặc password hash.

Errors:

```text
409 EMAIL_ALREADY_EXISTS
409 DOCTOR_LICENSE_NUMBER_ALREADY_EXISTS
```

---

## Create Receptionist

```text
POST /api/v1/admin/receptionists
```

Role:

```text
ADMIN
```

Request:

```json
{
  "email": "receptionist@example.com",
  "temporaryPassword": "Temp123!"
}
```

Response:

```text
201 CREATED
```

Response body: `StaffResponse`

```json
{
  "userId": 3,
  "email": "receptionist@example.com",
  "role": "RECEPTIONIST",
  "status": "ACTIVE",
  "createdAt": "2026-09-04T14:00:00"
}
```

Errors:

```text
409 EMAIL_ALREADY_EXISTS
```

---

## Staff list

```text
GET /api/v1/admin/staff?page=0&size=20&role=DOCTOR&status=ACTIVE
```

Role:

```text
ADMIN
```

`role` and `status` are optional filters. Only `DOCTOR` and `RECEPTIONIST` accounts are returned.

Response: `200 OK` - `StaffPageResponse`

```json
{
  "content": [
    {
      "userId": 3,
      "email": "receptionist@example.com",
      "role": "RECEPTIONIST",
      "status": "ACTIVE",
      "createdAt": "2026-09-04T14:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

## Activate / Deactivate User

Khuyến nghị action endpoint:

```text
POST /api/v1/admin/users/{userId}/activate
POST /api/v1/admin/users/{userId}/deactivate
```

Both actions return `200 OK` with `StaffResponse` and can change only a `DOCTOR` or `RECEPTIONIST` account.

Errors:

```text
404 STAFF_NOT_FOUND
```

Không hard delete account.

---

# 7. Patient Profile APIs

## View own profile

```text
GET /api/v1/patients/me
```

Role:

```text
PATIENT
```

Response:

```text
200 OK
```

Response body: `PatientProfileResponse`

---

## Update own profile

```text
PUT /api/v1/patients/me
```

Request ví dụ:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "dateOfBirth": "2002-05-10",
  "gender": "MALE",
  "address": "Ho Chi Minh City"
}
```

Không cho patient sửa:
- role
- status
- userId

Response:

```text
200 OK
```

Response body: `PatientProfileResponse`

```json
{
  "patientId": 1,
  "userId": 1,
  "email": "patient@example.com",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "dateOfBirth": "2002-05-10",
  "gender": "MALE",
  "address": "Ho Chi Minh City",
  "status": "ACTIVE",
  "createdAt": "2026-09-03T12:30:00",
  "updatedAt": "2026-09-03T13:00:00"
}
```

---

# 8. Doctor APIs

## Doctor list

```text
GET /api/v1/doctors
```

MVP:

```text
Authenticated users
```

Roles:

```text
ADMIN
DOCTOR
RECEPTIONIST
PATIENT
```

Chỉ trả về Doctor có tài khoản `ACTIVE`.

Query:

```text
?page=0
&size=20
&specialty=Cardiology
&name=tran
```

`specialty` và `name` là filter tùy chọn, tìm kiếm không phân biệt chữ hoa/thường.

Response: `200 OK` — `DoctorPageResponse`

```json
{
  "content": [
    {
      "doctorId": 5,
      "fullName": "Dr. Tran B",
      "phone": "0900000000",
      "specialty": "Cardiology",
      "bio": "Specializes in cardiovascular care."
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Không trả về `email`, `passwordHash`, `licenseNumber`, `userId`, role, hoặc các trường nội bộ của `User`.

---

## Doctor detail

```text
GET /api/v1/doctors/{doctorId}
```

Roles: tất cả authenticated roles.

Response: `200 OK` — `DoctorResponse`

```json
{
  "doctorId": 5,
  "fullName": "Dr. Tran B",
  "phone": "0900000000",
  "specialty": "Cardiology",
  "bio": "Specializes in cardiovascular care."
}
```

Nếu Doctor không tồn tại hoặc không còn `ACTIVE`, trả về `404 DOCTOR_NOT_FOUND`.

---

# 9. Doctor Schedule APIs

## Create schedule

```text
POST /api/v1/doctors/{doctorId}/schedules
```

Role:

```text
ADMIN
```

Request:

```json
{
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "12:00:00"
}
```

Validation:
- `dayOfWeek`, `startTime`, `endTime` bắt buộc.
- `startTime` phải nhỏ hơn `endTime`.
- Không overlap với schedule hiện có của cùng Doctor trong cùng `dayOfWeek`.
- Hai khoảng liền kề là hợp lệ, ví dụ `08:00-12:00` và `12:00-17:00`.

Response: `201 CREATED` — `DoctorScheduleResponse`

```json
{
  "scheduleId": 12,
  "doctorId": 5,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "12:00:00",
  "createdAt": "2026-09-04T09:00:00"
}
```

Errors:

```text
404 DOCTOR_NOT_FOUND
400 DOCTOR_SCHEDULE_INVALID_TIME_RANGE
409 DOCTOR_SCHEDULE_OVERLAP
```

---

## Update schedule

```text
PUT /api/v1/doctors/{doctorId}/schedules/{scheduleId}
```

Role:

```text
ADMIN
```

Request: `UpdateDoctorScheduleRequest`

```json
{
  "dayOfWeek": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "12:00:00"
}
```

Validation:

- `dayOfWeek`, `startTime`, `endTime` bắt buộc.
- `startTime` phải nhỏ hơn `endTime`.
- Schedule phải thuộc `doctorId` trên URL.
- Không overlap với schedule khác của cùng Doctor trong cùng `dayOfWeek`; loại trừ chính schedule đang cập nhật.

Response: `200 OK` — `DoctorScheduleResponse`

Errors:

```text
404 DOCTOR_NOT_FOUND
404 DOCTOR_SCHEDULE_NOT_FOUND
400 DOCTOR_SCHEDULE_INVALID_TIME_RANGE
409 DOCTOR_SCHEDULE_OVERLAP
```

---

## Delete schedule

Có thể cho phép hard delete vì đây là configuration tương lai, không phải medical history:

```text
DELETE /api/v1/doctors/{doctorId}/schedules/{scheduleId}
```

Role:

```text
ADMIN
```

Rule: hard delete chỉ được phép khi schedule không bao phủ bất kỳ Appointment `PENDING` hoặc `CONFIRMED` chưa kết thúc từ hiện tại trở đi. Appointment historical (`COMPLETED`/`CANCELLED`) không chặn xóa. Rule này giữ nguyên giờ khám của các lịch đã được đặt.

Response: `204 NO CONTENT`

Errors:

```text
404 DOCTOR_NOT_FOUND
404 DOCTOR_SCHEDULE_NOT_FOUND
409 DOCTOR_SCHEDULE_HAS_ACTIVE_APPOINTMENTS
```

---

## View doctor schedule

```text
GET /api/v1/doctors/{doctorId}/schedules
```

Roles: tất cả authenticated roles.

Response: `200 OK` — `DoctorScheduleResponse[]`

```json
[
  {
    "scheduleId": 12,
    "doctorId": 5,
    "dayOfWeek": "MONDAY",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "createdAt": "2026-09-04T09:00:00"
  },
  {
    "scheduleId": 13,
    "doctorId": 5,
    "dayOfWeek": "MONDAY",
    "startTime": "13:00:00",
    "endTime": "17:00:00",
    "createdAt": "2026-09-04T09:05:00"
  }
]
```

Chỉ trả schedule của Doctor có tài khoản `ACTIVE`. Kết quả luôn được sắp theo `dayOfWeek` từ `MONDAY` đến `SUNDAY`, sau đó theo `startTime` tăng dần.

Error:

```text
404 DOCTOR_NOT_FOUND
```

---

# 10. Available Slots API

```text
GET /api/v1/doctors/{doctorId}/available-slots?date=2026-09-10
```

Actor:
- PATIENT
- RECEPTIONIST
- DOCTOR và ADMIN cũng được phép đọc trong MVP.

Query:

```text
date=2026-09-10
```

`date` là bắt buộc, dùng định dạng ISO `yyyy-MM-dd`.

Response:

```json
{
  "doctorId": 5,
  "date": "2026-09-10",
  "slotDurationMinutes": 30,
  "slots": [
    {
      "startTime": "08:00:00",
      "endTime": "08:30:00"
    },
    {
      "startTime": "08:30:00",
      "endTime": "09:00:00"
    }
  ]
}
```

Logic:

```text
Weekly DoctorSchedule
        -
Active Appointments(PENDING/CONFIRMED)
        =
Available Slots
```

Mỗi slot có thời lượng cố định 30 phút. Chỉ trả slot có thời điểm bắt đầu nằm trong tương lai; ngày quá khứ trả danh sách `slots` rỗng.

Errors:

```text
404 DOCTOR_NOT_FOUND
```

---

# 11. Appointment APIs

## Patient books appointment

```text
POST /api/v1/appointments
```

Role:

```text
PATIENT
```

Request:

```json
{
  "doctorId": 5,
  "appointmentDate": "2026-09-10",
  "startTime": "10:00:00",
  "reason": "Đau đầu kéo dài 3 ngày"
}
```

Không nhận:

```text
patientId
endTime
status
```

Backend tự:
- lấy Patient hiện tại;
- tính endTime;
- đặt status = PENDING.

Response: `201 CREATED` — `AppointmentResponse`

```json
{
  "appointmentId": 101,
  "patientId": 10,
  "doctorId": 5,
  "appointmentDate": "2026-09-10",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "status": "PENDING",
  "reason": "Đau đầu kéo dài 3 ngày",
  "createdAt": "2026-09-04T10:00:00"
}
```

Errors:

```text
404 DOCTOR_NOT_FOUND
409 DOCTOR_NOT_AVAILABLE
400 APPOINTMENT_TIME_PASSED
409 APPOINTMENT_SLOT_NOT_AVAILABLE
409 APPOINTMENT_SLOT_ALREADY_BOOKED
409 PATIENT_TIME_CONFLICT
```

---

## Receptionist creates appointment for patient

```text
POST /api/v1/receptionist/appointments
```

Role:

```text
RECEPTIONIST
```

Request:

```json
{
  "patientId": 10,
  "doctorId": 5,
  "appointmentDate": "2026-09-10",
  "startTime": "10:00:00",
  "reason": "Đặt lịch tại quầy"
}
```

Status ban đầu vẫn:

```text
PENDING
```

Response: `201 CREATED` - `AppointmentResponse`

The booking applies the same availability, schedule, future-time, Doctor conflict, and Patient time-conflict rules as Patient self-booking.

Khuyến nghị giữ cùng lifecycle thay vì tự động CONFIRMED.

---

## Patient views own appointments

```text
GET /api/v1/appointments/me
```

Role:

```text
PATIENT
```

Filter:

```text
?status=CONFIRMED
&fromDate=2026-09-01
&toDate=2026-09-30
&page=0
&size=20
&sort=appointmentDate,desc
```

Response: `200 OK` — `PatientAppointmentPageResponse`

```json
{
  "content": [
    {
      "appointmentId": 101,
      "doctorId": 5,
      "doctorFullName": "Dr. Nguyen Van B",
      "doctorSpecialty": "Internal Medicine",
      "appointmentDate": "2026-09-10",
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "status": "PENDING",
      "reason": "Persistent headache",
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Only `appointmentDate,asc` and `appointmentDate,desc` are accepted for `sort`; `appointmentDate,desc` is the default. The Patient identity is always derived from JWT.

Errors:

```text
400 INVALID_APPOINTMENT_DATE_RANGE
400 INVALID_APPOINTMENT_SORT
404 PATIENT_PROFILE_NOT_FOUND
```

---

## Doctor views own appointments

```text
GET /api/v1/doctor/appointments
```

Role:

```text
DOCTOR
```

Filter:
- date
- status
- page
- size

Doctor identity lấy từ authenticated user, không nhận doctorId từ client.

---

Response: `200 OK` — `DoctorAppointmentPageResponse`

```json
{
  "content": [
    {
      "appointmentId": 101,
      "patientId": 10,
      "patientFullName": "Nguyen Van A",
      "appointmentDate": "2026-09-10",
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "status": "CONFIRMED",
      "reason": "Persistent headache",
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Results are ordered by `appointmentDate` and `startTime`, ascending. The response excludes Patient phone, date of birth, address, and internal User fields.

Errors:

```text
403 ACCOUNT_INACTIVE
404 DOCTOR_PROFILE_NOT_FOUND
```

## Receptionist manages appointment list

```text
GET /api/v1/receptionist/appointments
```

Role:

```text
RECEPTIONIST
```

Filter:

```text
?date=2026-09-10
&doctorId=5
&patientId=10
&status=PENDING
&page=0
&size=20
```

---

Response: `200 OK` — `ReceptionistAppointmentPageResponse`

```json
{
  "content": [
    {
      "appointmentId": 101,
      "patientId": 10,
      "patientFullName": "Nguyen Van A",
      "doctorId": 5,
      "doctorFullName": "Dr. Nguyen Van B",
      "doctorSpecialty": "Internal Medicine",
      "appointmentDate": "2026-09-10",
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "status": "PENDING",
      "reason": "Persistent headache",
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Results are ordered by `appointmentDate` and `startTime`, ascending. The response excludes Patient contact/profile fields and all internal User fields.

---

# 12. Confirm Appointment

```text
POST /api/v1/appointments/{appointmentId}/confirm
```

Role:

```text
RECEPTIONIST
```

Request body:

```text
không cần
```

Success:

```text
200 OK
```

Errors:

```text
404 APPOINTMENT_NOT_FOUND
409 INVALID_APPOINTMENT_STATUS_TRANSITION
400 APPOINTMENT_TIME_PASSED
```

---

# 13. Cancel Appointment

```text
POST /api/v1/appointments/{appointmentId}/cancel
```

Role: `PATIENT`

```text
POST /api/v1/receptionist/appointments/{appointmentId}/cancel
```

Role: `RECEPTIONIST`

Request: `CancelAppointmentRequest`

```json
{
  "reason": "Unexpected work"
}
```

Success: `200 OK` with no response body.

Rules:

- only `PENDING` or `CONFIRMED` appointments can be cancelled;
- Patient can cancel only their own appointment and only at least 2 hours before it starts;
- Receptionist can cancel an appointment without the 2-hour deadline;
- the appointment remains in history with status `CANCELLED`, cancellation reason, time, and actor.

Errors:

```text
404 APPOINTMENT_NOT_FOUND
403 APPOINTMENT_OWNERSHIP_FORBIDDEN
409 INVALID_APPOINTMENT_STATUS_TRANSITION
409 APPOINTMENT_CANCELLATION_DEADLINE_PASSED
```

Thay vì hai URL khác nhau, có thể dùng cùng action endpoint:

```text
POST /api/v1/appointments/{appointmentId}/cancel
```

Role:

```text
PATIENT
RECEPTIONIST
```

Service phân biệt actor từ authentication.

Request:

```json
{
  "reason": "Có việc đột xuất"
}
```

Rules:
- Patient chỉ cancel appointment của chính mình.
- Patient phải trước giờ khám >= 2h.
- Receptionist không bị rule 2h trong MVP.
- Chỉ PENDING/CONFIRMED được cancel.

Response:

```text
200 OK
```

---

# 14. Create Medical Record + Complete Appointment

Khuyến nghị API:

```text
POST /api/v1/appointments/{appointmentId}/medical-record
```

Role:

```text
DOCTOR
```

Request:

```json
{
  "symptoms": "Sốt, đau họng",
  "diagnosis": "Viêm họng cấp",
  "treatment": "Nghỉ ngơi, uống nhiều nước",
  "notes": "Theo dõi thêm 3 ngày"
}
```

Business:
- Appointment thuộc Doctor hiện tại.
- status phải CONFIRMED.
- appointment đã đến giờ khám.
- chưa có MedicalRecord.
- save MedicalRecord.
- update Appointment -> COMPLETED.
- cùng transaction.

Response:

```text
201 CREATED
```

---

# 15. View Medical Records

## Patient xem own medical history

```text
GET /api/v1/patients/me/medical-records
```

Role:

```text
PATIENT
```

Pagination:

```text
?page=0&size=20&sort=createdAt,desc
```

Only `createdAt,asc` and `createdAt,desc` are accepted for `sort`; `createdAt,desc` is the default.

Response: `200 OK` - `PatientMedicalRecordPageResponse`

```json
{
  "content": [
    {
      "medicalRecordId": 55,
      "appointmentId": 101,
      "symptoms": "Fever and sore throat",
      "diagnosis": "Acute pharyngitis",
      "treatment": "Rest and drink water",
      "notes": "Follow up in three days",
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

The Patient identity is always derived from JWT. The response contains only that Patient's records and does not expose internal User data.

Errors:

```text
400 INVALID_MEDICAL_RECORD_SORT
404 PATIENT_PROFILE_NOT_FOUND
```

---

## Doctor xem medical history của Patient

Khuyến nghị không cho Doctor đọc tùy ý mọi Patient.

Endpoint:

```text
GET /api/v1/doctor/patients/{patientId}/medical-records
```

Role:

```text
DOCTOR
```

Pagination:

```text
?page=0&size=20
```

Response: `200 OK` - `DoctorPatientMedicalRecordPageResponse`

```json
{
  "patientId": 10,
  "content": [
    {
      "medicalRecordId": 55,
      "appointmentId": 101,
      "symptoms": "Fever and sore throat",
      "diagnosis": "Acute pharyngitis",
      "treatment": "Rest and drink water",
      "notes": "Follow up in three days",
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Business authorization: Doctor is allowed only when at least one Appointment exists between the authenticated Doctor and the requested Patient. Once this clinical relationship exists, the Doctor may read the Patient's medical-history records needed for care. Results are ordered by `createdAt` descending.

Không chỉ dựa vào role.

Errors:

```text
403 DOCTOR_PATIENT_MEDICAL_RECORD_ACCESS_FORBIDDEN
404 DOCTOR_PROFILE_NOT_FOUND
404 PATIENT_NOT_FOUND
```

---

# 16. Medicine APIs

## Doctor views medicine list

```text
GET /api/v1/medicines
```

Role:

```text
DOCTOR
```

Filter:

```text
?name=para
&active=true
&page=0
&size=20
```

Both `name` and `active` are optional. Results are ordered by medicine name ascending.

Response: `200 OK` - `MedicinePageResponse`

```json
{
  "content": [
    {
      "medicineId": 3,
      "name": "Paracetamol",
      "unit": "tablet",
      "description": "Pain relief and fever reduction",
      "active": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

The endpoint is restricted to an authenticated `ACTIVE` Doctor. It exposes only Medicine catalogue fields needed to select a medicine for a Prescription.

Errors:

```text
403 ACCOUNT_INACTIVE
404 DOCTOR_PROFILE_NOT_FOUND
```

MVP chưa cần full CRUD medicine nếu muốn giảm scope.

Có thể seed danh mục ban đầu.

---

# 17. Create Prescription

Có hai cách.

## Option A

Tạo Prescription riêng sau Medical Record:

```text
POST /api/v1/medical-records/{medicalRecordId}/prescription
```

## Option B

Tạo Medical Record và Prescription trong cùng request.

### Khuyến nghị

Dùng **Option A**.

Lý do:
- MedicalRecord vẫn hợp lệ ngay cả khi không cần thuốc.
- Request không quá lớn.
- Transaction boundary dễ hiểu.
- Prescription là sub-resource rõ.

Request:

```json
{
  "notes": "Uống sau ăn",
  "items": [
    {
      "medicineId": 1,
      "dosage": "1 viên",
      "frequency": "2 lần/ngày",
      "duration": "5 ngày",
      "quantity": 10,
      "instruction": "Sau ăn sáng và tối"
    }
  ]
}
```

Role:

```text
DOCTOR
```

Business:
- MedicalRecord thuộc Appointment của Doctor.
- chưa có Prescription.
- medicine phải tồn tại và active.
- items không được rỗng nếu tạo prescription.

Response:

```text
201 CREATED
```

---

# 18. View Prescription

## Patient

```text
GET /api/v1/patients/me/prescriptions
```

Role:

```text
PATIENT
```

Pagination:

```text
?page=0&size=20
```

Response: `200 OK` - `PatientPrescriptionPageResponse`

```json
{
  "content": [
    {
      "prescriptionId": 70,
      "medicalRecordId": 55,
      "appointmentId": 101,
      "notes": "Take after food",
      "details": [
        {
          "medicineId": 3,
          "medicineName": "Paracetamol",
          "dosage": "1 tablet",
          "frequency": "2 times/day",
          "duration": "5 days",
          "quantity": 10,
          "instruction": "After breakfast and dinner"
        }
      ],
      "createdAt": "2026-09-04T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

The Patient identity is always derived from JWT. The endpoint returns only that Patient's Prescriptions, including the medicine name and dosage details needed for display. Results are ordered by `createdAt` descending.

Errors:

```text
404 PATIENT_PROFILE_NOT_FOUND
```

hoặc:

```text
GET /api/v1/medical-records/{medicalRecordId}/prescription
```

Roles:

```text
PATIENT
DOCTOR
```

Response: `200 OK` - `PrescriptionViewResponse`

```json
{
  "prescriptionId": 70,
  "medicalRecordId": 55,
  "appointmentId": 101,
  "notes": "Take after food",
  "details": [
    {
      "medicineId": 3,
      "medicineName": "Paracetamol",
      "dosage": "1 tablet",
      "frequency": "2 times/day",
      "duration": "5 days",
      "quantity": 10,
      "instruction": "After breakfast and dinner"
    }
  ],
  "createdAt": "2026-09-04T10:00:00"
}
```

Ownership is mandatory: a Patient may read only a Prescription from their own Medical Record; a Doctor may read only a Prescription from an Appointment that belongs to that Doctor. The endpoint does not allow ADMIN or RECEPTIONIST access in the MVP.

Errors:

```text
403 PRESCRIPTION_ACCESS_FORBIDDEN
404 PRESCRIPTION_NOT_FOUND
```

MVP có thể hỗ trợ cả:
- list own prescriptions;
- detail prescription.

---

# 19. DTO naming convention

Ví dụ:

```text
RegisterPatientRequest
LoginRequest
LoginResponse
RefreshTokenRequest

CreateDoctorRequest
DoctorResponse

CreateDoctorScheduleRequest
DoctorScheduleResponse

CreateAppointmentRequest
AppointmentResponse
CancelAppointmentRequest

CreateMedicalRecordRequest
MedicalRecordResponse

CreatePrescriptionRequest
PrescriptionItemRequest
PrescriptionResponse
```

Không dùng một DTO cho create/update/response nếu semantic khác nhau.

---

# 20. Validation strategy

Dùng Bean Validation cho structural validation:

```text
@NotNull
@NotBlank
@Email
@Size
@Positive
@Past
```

Business validation để Service xử lý:

```text
Doctor ACTIVE
slot thuộc schedule
slot chưa booked
status transition
ownership
cancellation deadline
medicine active
```

Không cố nhét business validation phức tạp vào annotation.

---

# 21. HTTP Status Convention

## Success

```text
200 OK
GET thành công
action update thành công

201 CREATED
tạo resource mới

204 NO CONTENT
DELETE schedule thành công nếu không trả body
```

## Client errors

```text
400 BAD REQUEST
validation/business input invalid

401 UNAUTHORIZED
chưa login / token invalid

403 FORBIDDEN
đã login nhưng không có quyền

404 NOT FOUND
resource không tồn tại

409 CONFLICT
state conflict / duplicate booking
```

---

# 22. Error Codes đề xuất

```text
VALIDATION_ERROR

USER_NOT_FOUND
EMAIL_ALREADY_EXISTS
ACCOUNT_INACTIVE
INVALID_CREDENTIALS
INVALID_REFRESH_TOKEN
DOCTOR_LICENSE_NUMBER_ALREADY_EXISTS

DOCTOR_NOT_FOUND
DOCTOR_NOT_AVAILABLE

PATIENT_NOT_FOUND

SCHEDULE_NOT_FOUND
SCHEDULE_OVERLAP
INVALID_SCHEDULE_TIME

APPOINTMENT_NOT_FOUND
APPOINTMENT_SLOT_ALREADY_BOOKED
PATIENT_TIME_CONFLICT
INVALID_APPOINTMENT_SLOT
APPOINTMENT_TIME_IN_PAST
APPOINTMENT_TIME_PASSED
INVALID_APPOINTMENT_STATUS_TRANSITION
APPOINTMENT_ACCESS_DENIED
CANCELLATION_DEADLINE_PASSED

MEDICAL_RECORD_NOT_FOUND
MEDICAL_RECORD_ALREADY_EXISTS

MEDICINE_NOT_FOUND
MEDICINE_INACTIVE

PRESCRIPTION_NOT_FOUND
PRESCRIPTION_ALREADY_EXISTS
```

---

# 23. Pagination convention

Spring Pageable có thể dùng:

```text
?page=0
&size=20
&sort=appointmentDate,desc
```

Giới hạn size ở backend.

Ví dụ:

```text
default size = 20
max size = 100
```

Tránh client gửi:

```text
size=1000000
```

---

# 24. Filtering convention

Không tạo endpoint riêng cho từng filter.

Tốt:

```text
GET /appointments?status=PENDING&date=2026-09-10
```

Không nên:

```text
/getPendingAppointments
/getAppointmentsByDate
/getPendingAppointmentsByDoctor
```

---

# 25. API Security Matrix tóm tắt

| API | ADMIN | DOCTOR | RECEPTIONIST | PATIENT |
|---|---:|---:|---:|---:|
| Register Patient | Public | Public | Public | Public |
| Create Doctor | Yes | No | No | No |
| Create Receptionist | Yes | No | No | No |
| Manage Schedule | Yes | No | No | No |
| View Doctor/Schedule | Yes | Yes | Yes | Yes |
| View Available Slots | Optional | Optional | Yes | Yes |
| Patient Book Appointment | No | No | No | Yes |
| Create Appointment for Patient | No | No | Yes | No |
| Confirm Appointment | No | No | Yes | No |
| Cancel Appointment | No | No | Yes | Own only |
| Doctor Appointment List | No | Own only | No | No |
| Create Medical Record | No | Own appointment | No | No |
| Create Prescription | No | Own medical record | No | No |
| View Own Medical Data | No | Relevant only | No | Own only |

Điểm điều chỉnh so với tài liệu bước 02:

- Doctor **không cancel Appointment** trong MVP.
- Admin **không xem nội dung Medical Record/Prescription** trong MVP.
- Admin/Doctor có thể xem available slots nếu UI cần, nhưng actor nghiệp vụ chính vẫn là Patient/Receptionist.

---

# 26. Endpoint Summary

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

POST   /api/v1/admin/doctors
POST   /api/v1/admin/receptionists
GET    /api/v1/admin/staff
POST   /api/v1/admin/users/{id}/activate
POST   /api/v1/admin/users/{id}/deactivate

GET    /api/v1/patients/me
PUT    /api/v1/patients/me

GET    /api/v1/doctors
GET    /api/v1/doctors/{id}

POST   /api/v1/doctors/{doctorId}/schedules
PUT    /api/v1/doctors/{doctorId}/schedules/{scheduleId}
DELETE /api/v1/doctors/{doctorId}/schedules/{scheduleId}
GET    /api/v1/doctors/{doctorId}/schedules
GET    /api/v1/doctors/{doctorId}/available-slots

POST   /api/v1/appointments
GET    /api/v1/appointments/me

POST   /api/v1/receptionist/appointments
GET    /api/v1/receptionist/appointments

GET    /api/v1/doctor/appointments

POST   /api/v1/appointments/{id}/confirm
POST   /api/v1/appointments/{id}/cancel

POST   /api/v1/appointments/{id}/medical-record
GET    /api/v1/patients/me/medical-records
GET    /api/v1/doctor/patients/{patientId}/medical-records

GET    /api/v1/medicines

POST   /api/v1/medical-records/{id}/prescription
GET    /api/v1/patients/me/prescriptions
GET    /api/v1/medical-records/{id}/prescription
```

---

# 27. Những API chưa cần cho MVP đầu

Chưa thêm:

```text
Forgot Password
Email verification
OAuth2
Invoice/Payment
Notification
Medicine inventory
Doctor TimeOff
Audit log API
Admin medical-record viewer
Bulk operations
```

---

# 28. Review thiết kế

Thiết kế API hiện có các điểm tốt:

1. Không expose Entity.
2. Authenticated identity lấy từ token, không tin ID client khi không cần.
3. State transition dùng business action rõ nghĩa.
4. Ownership được kiểm tra ở service, không chỉ role.
5. HTTP status có semantic.
6. Error code ổn định cho frontend.
7. Pagination/filter theo REST convention.
8. Scope không quá lớn.
9. Core flow có thể demo end-to-end.

---

# 29. Core Demo Flow qua API

```text
1. POST /auth/register
2. POST /auth/login

3. GET /doctors
4. GET /doctors/{id}/available-slots

5. POST /appointments
   -> PENDING

6. Receptionist:
   POST /appointments/{id}/confirm
   -> CONFIRMED

7. Doctor:
   POST /appointments/{id}/medical-record
   -> MedicalRecord created
   -> Appointment COMPLETED

8. Doctor:
   POST /medical-records/{id}/prescription

9. Patient:
   GET /patients/me/medical-records
   GET /patients/me/prescriptions
```

Đây sẽ là flow quan trọng nhất khi demo project và đi phỏng vấn.

---

# 30. Bước tiếp theo

Sau khi API contract được chốt:

# 08 - Initialize Spring Boot Project

Việc đầu tiên của bước 08:

1. Kiểm tra Java/JDK.
2. Tạo project Spring Boot.
3. Chọn dependencies.
4. Tạo Git repository ngay từ đầu.
5. Tạo `.gitignore`.
6. Tạo cấu trúc package ban đầu.
7. Cấu hình MySQL connection.
8. Chạy application lần đầu.
9. Commit milestone đầu tiên.

Docker chưa cần đưa vào ngay tại thời điểm này.

Ta sẽ thêm Docker sau khi backend + MySQL chạy ổn ở local.
