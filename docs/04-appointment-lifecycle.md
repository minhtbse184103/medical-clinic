# 04 - Appointment Lifecycle

## 1. Mục tiêu
Hoàn thiện vòng đời Appointment trước khi thiết kế Domain Model và Database.

Use Case:
- UC-23 - Confirm Appointment
- UC-24 - Cancel Appointment
- UC-26 - Complete Appointment

## 2. Appointment State Machine

```text
PENDING
  ├─> CONFIRMED ──> COMPLETED
  │        └──────> CANCELLED
  └───────────────> CANCELLED
```

Terminal states:
```text
COMPLETED
CANCELLED
```

## 3. Quyền thay đổi trạng thái

| Transition | Actor |
|---|---|
| PENDING -> CONFIRMED | RECEPTIONIST |
| PENDING -> CANCELLED | PATIENT hoặc RECEPTIONIST |
| CONFIRMED -> CANCELLED | PATIENT hoặc RECEPTIONIST |
| CONFIRMED -> COMPLETED | DOCTOR, thông qua nghiệp vụ tạo Medical Record |

ADMIN không trực tiếp điều khiển lifecycle Appointment trong MVP.

---

## 4. UC-23 - Confirm Appointment

### Actor
RECEPTIONIST

### Preconditions
1. Receptionist đã đăng nhập và ACTIVE.
2. Appointment tồn tại.
3. Appointment đang `PENDING`.
4. Doctor và Patient vẫn ACTIVE.
5. Thời gian khám chưa qua.

### Main Flow
1. Receptionist chọn Appointment `PENDING`.
2. Gửi yêu cầu confirm.
3. Backend kiểm tra quyền và trạng thái.
4. Chuyển `PENDING -> CONFIRMED`.
5. Lưu `confirmedAt`.
6. Commit transaction.
7. Trả Appointment đã cập nhật.

### Business Rules
- Chỉ Receptionist được confirm trong MVP.
- Chỉ `PENDING` được confirm.
- Không cho client gửi status tùy ý.
- Không confirm Appointment đã qua giờ.

### Error Cases
```text
404 APPOINTMENT_NOT_FOUND
409 INVALID_APPOINTMENT_STATUS_TRANSITION
400 APPOINTMENT_TIME_PASSED
```

---

## 5. UC-24 - Cancel Appointment

### Actor
- PATIENT
- RECEPTIONIST

### Patient Preconditions
1. Patient đã đăng nhập.
2. Appointment thuộc chính Patient.
3. Status là `PENDING` hoặc `CONFIRMED`.
4. Chưa vượt cancellation deadline.

### Receptionist Preconditions
1. Receptionist đã đăng nhập.
2. Appointment tồn tại.
3. Status là `PENDING` hoặc `CONFIRMED`.

### Business Rules
- Patient chỉ cancel Appointment của mình.
- Không cancel `COMPLETED` hoặc `CANCELLED`.
- MVP đề xuất: Patient chỉ được tự hủy trước giờ khám ít nhất **2 giờ**.
- Receptionist có thể hủy gần giờ hơn vì xử lý nghiệp vụ hành chính.
- Không xóa row Appointment khi cancel.
- Nên lưu:
```text
cancelledAt
cancelReason
```
- Có thể thêm `cancelledBy` nếu muốn audit rõ hơn.

### Vấn đề rebook slot
Appointment `CANCELLED` phải được giữ lịch sử, nhưng slot nên có thể được đặt lại.

Vì vậy không nên giải quyết cancel bằng DELETE.

Cách xử lý cụ thể sẽ chốt ở Database Design.

---

## 6. UC-26 - Complete Appointment

### Actor
DOCTOR

### Preconditions
1. Doctor đã đăng nhập và ACTIVE.
2. Appointment thuộc Doctor hiện tại.
3. Appointment đang `CONFIRMED`.
4. Appointment không bị cancel.
5. Thời điểm khám đã tới.

### Business Rules
- Doctor không được complete Appointment của Doctor khác.
- Không cho `PENDING -> COMPLETED`.
- Không cho `CANCELLED -> COMPLETED`.
- Không cho `COMPLETED -> COMPLETED`.
- Nên lưu `completedAt`.

---

## 7. Quyết định quan trọng: Complete và Medical Record

Có hai lựa chọn:

### Option A
```text
CONFIRMED -> COMPLETED -> Create Medical Record
```

Nhược điểm: có thể xuất hiện Appointment `COMPLETED` nhưng chưa có Medical Record.

### Option B - Khuyến nghị
```text
CONFIRMED
   -> Doctor tạo Medical Record
   -> Medical Record save thành công
   -> Appointment = COMPLETED
```

Chọn **Option B** cho MVP.

Lý do: trạng thái "đã khám xong" nên gắn với việc Doctor đã ghi nhận kết quả khám.

Hai thao tác nên nằm trong cùng transaction:

```text
BEGIN
validate appointment
validate doctor ownership
INSERT medical_record
UPDATE appointment SET status = COMPLETED, completed_at = now()
COMMIT
```

Nếu một bước lỗi:
```text
ROLLBACK
```

---

## 8. Appointment - Medical Record Relationship

```text
Appointment 1 ---- 0..1 MedicalRecord
```

Trước khi khám: chưa có Medical Record.

Sau khi khám hoàn tất: có đúng một Medical Record.

Database nên cân nhắc:
```text
UNIQUE (appointment_id)
```
ở bảng `medical_records`.

---

## 9. Appointment Audit Fields đề xuất

```text
createdAt
updatedAt
confirmedAt
cancelledAt
completedAt
cancelReason
```

Có thể cân nhắc:
```text
cancelledBy
```

---

## 10. State Transition Validation

Không nên:
```text
appointment.setStatus(request.status)
```

Nên có các operation mang ý nghĩa nghiệp vụ:
```text
confirmAppointment()
cancelAppointment()
createMedicalRecordAndCompleteAppointment()
```

MVP chỉ cần:
```text
enum AppointmentStatus + service validation
```

Không cần State Pattern hay workflow engine.

---

## 11. Error Codes chính

```text
APPOINTMENT_NOT_FOUND
INVALID_APPOINTMENT_STATUS_TRANSITION
APPOINTMENT_TIME_PASSED
CANCELLATION_DEADLINE_PASSED
APPOINTMENT_ACCESS_DENIED
MEDICAL_RECORD_ALREADY_EXISTS
```

Mapping HTTP chi tiết sẽ chốt ở REST API Design.

---

## 12. Review tổng thể

Flow đã chốt:

```text
Patient Book
    |
    v
PENDING
    |
Receptionist Confirm
    |
    v
CONFIRMED
   / \
  /   \
Cancel  Doctor examines
 |      |
 v      v
CANCELLED
       Create Medical Record
            |
            v
        COMPLETED
```

Đây là flow đủ thực tế nhưng vẫn phù hợp scope Fresher/Junior.

---

## 13. Các quyết định đã chốt

1. Patient tạo Appointment -> `PENDING`.
2. Receptionist confirm -> `CONFIRMED`.
3. Patient hoặc Receptionist có thể cancel `PENDING/CONFIRMED`.
4. Patient chỉ tự hủy trước giờ khám ít nhất 2 giờ.
5. `CANCELLED` và `COMPLETED` là terminal states.
6. Appointment cancel không bị delete.
7. Một Appointment có tối đa một Medical Record.
8. Doctor tạo Medical Record cho Appointment của mình.
9. Tạo Medical Record thành công sẽ chuyển Appointment sang `COMPLETED`.
10. Tạo Medical Record + complete Appointment nằm trong cùng transaction.

---

## 14. Các quyết định để dành cho Database Design

1. Cách rebook slot đã `CANCELLED`.
2. Cách lưu actor đã cancel.
3. Doctor Schedule model.
4. Appointment indexes.
5. Unique constraints.
6. User / Doctor / Patient relationship.
7. Có cần status history table không.

MVP hiện tại chưa cần status history table.

---

## 15. Bước tiếp theo

# Domain Model & Database Design

Thứ tự:
1. Liệt kê Entity.
2. Xác định trách nhiệm từng Entity.
3. Xác định relationship.
4. Chốt User / Doctor / Patient model.
5. Chốt Doctor Schedule.
6. Chốt Appointment schema.
7. Giải quyết rebook slot CANCELLED.
8. Primary Key / Foreign Key.
9. Unique Constraint.
10. Index.
11. Vẽ ERD.

Chưa viết JPA Entity trước khi hoàn thành bước này.
