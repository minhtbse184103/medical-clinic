# 08 - UI Design Brief

Tài liệu này để đưa cho AI thiết kế giao diện (Stitch, v0, Figma AI...). Nó mô tả **chính xác
những gì hệ thống đang có**, để bản thiết kế trả về code được ngay mà không phải bịa dữ liệu.

## Cách dùng

1. Dán **Master context** (mục 2) vào đầu mỗi prompt.
2. Dán thêm prompt của **một màn hình** (mục 4). Đừng yêu cầu nhiều màn hình một lúc.
3. Nhận thiết kế về, gửi lại ảnh cho người code.

Prompt viết bằng tiếng Anh vì các công cụ thiết kế xử lý tiếng Anh tốt hơn, nhưng
**chữ hiển thị trên giao diện phải là tiếng Việt** — điều này đã ghi trong prompt.

---

## 1. Ràng buộc quan trọng nhất

Hai lần thử trước, bản thiết kế chứa những thứ hệ thống không có: tin nhắn chưa đọc, kết quả
xét nghiệm, trạng thái "Active" của thuốc, chuông thông báo, link quên mật khẩu. Vẽ chúng ra thì
code không thể làm thật, chỉ còn cách bỏ đi hoặc bịa dữ liệu.

**Danh sách những thứ KHÔNG được đưa vào thiết kế:**

```text
KHÔNG có nhắn tin / chat / hộp thư
KHÔNG có chuông thông báo, badge số thông báo
KHÔNG có xét nghiệm, kết quả cận lâm sàng, chỉ số sinh hiệu, biểu đồ sức khỏe
KHÔNG có trạng thái thuốc (đang dùng / đã ngưng) — dòng thuốc không có trường trạng thái
KHÔNG có quên mật khẩu / đặt lại mật khẩu
KHÔNG có thanh toán, hóa đơn, bảo hiểm
KHÔNG có ảnh đại diện tải lên — avatar chỉ là chữ cái đầu trên nền màu
KHÔNG có đánh giá / xếp hạng bác sĩ
KHÔNG có video call, tư vấn từ xa
KHÔNG có lịch sử đăng nhập, nhật ký hoạt động
KHÔNG có trạng thái "bệnh nhân không đến" (no-show)
KHÔNG có thống kê doanh thu, biểu đồ theo tháng
```

Chỉ được dùng dữ liệu liệt kê trong từng màn hình ở mục 4.

---

## 2. Master context

Dán khối này vào đầu mọi prompt:

```text
I am designing a clinic management web app called "Medical Clinic".

Product: a small outpatient clinic system. Patients book 30-minute appointment slots with
doctors. A receptionist confirms or cancels bookings. The doctor examines the patient, writes
a medical record, and prescribes medicine. An admin manages staff accounts and weekly working
schedules.

Four roles, each with its own navigation: PATIENT, DOCTOR, RECEPTIONIST, ADMIN.

Visual direction:
- Clean, calm, medical. Light background (#f4f6f9), white cards, generous whitespace.
- Primary blue #1677ff. Accent teal #0d9488 used only for the single most important figure
  on a dashboard. Status colours: amber = waiting, blue = confirmed, green = done, red = cancelled.
- Border radius 8-12px, soft shadows, no heavy borders.
- Desktop-first at 1440px, must also work at 768px and 375px.
- Left sidebar navigation (dark), top bar with the user's name, role and initials avatar.

Technical constraint: this will be built with Ant Design v5 React components. Design with
components that exist there: Card, Table, Form, Select, DatePicker, Tag, Statistic, List,
Modal, Popconfirm, Alert, Empty, Descriptions, Radio.Group, Steps, Avatar, Badge, Tabs.
Do not invent custom chart types, carousels, or animated widgets.

All visible text must be in Vietnamese.

Show three states for any list: loaded with data, empty, and loading skeleton.
```

---

## 3. Design system đang dùng

| Thành phần | Giá trị |
|---|---|
| Màu chính | `#1677ff` |
| Màu nhấn | `#0d9488` (chỉ dùng cho 1 ô số liệu quan trọng nhất) |
| Nền trang | `#f4f6f9` |
| Nền hàng danh sách | `#f8fafc` |
| Chữ phụ | `#667085` |
| Bo góc | 8px (nút, input), 12px (hàng danh sách), 16-24px (card lớn) |
| Font | System font stack, không dùng webfont |
| Trạng thái lịch hẹn | Chờ xác nhận = vàng · Đã xác nhận = xanh dương · Đã khám = xanh lá · Đã hủy = đỏ |

---

## 4. Prompt từng màn hình

### 4.1 Đăng nhập — `/login`

```text
Design a sign-in screen. Two columns inside one large rounded white container on a tinted
background. Left column: brand lockup at top-left (a pulse-line icon in a rounded blue tile
plus the product name), then vertically centred: a large bold heading, a subtitle, an email
field and a password field (large, filled grey background, leading icon), a full-width primary
button, and a line linking to registration. Right column: a blue gradient panel with rounded
corners containing a circular icon badge, a large white heading, a paragraph, and a row of
three short figures. The right column disappears below 992px.
No "forgot password" link: the system has no password reset.
Vietnamese labels: "Địa chỉ email", "Mật khẩu", "Đăng nhập", "Chưa có tài khoản? Đăng ký ngay".
```

### 4.2 Đăng ký bệnh nhân — `/register`

```text
Same two-column shell as the sign-in screen. The form collects: email (required), password
(required, min 8 characters), full name (required), phone, date of birth, gender, address.
Date of birth and gender sit side by side on one row. Full-width primary submit button and a
link back to sign-in. Vietnamese labels.
```

### 4.3 Dashboard — Bệnh nhân — `/`

```text
Design the patient home screen.

Top: a greeting heading with today's date underneath.

A row of four summary tiles. The first is filled with the teal accent colour and shows the
date of the next upcoming appointment. The other three are white with a coloured outline icon
on the right: number of appointments awaiting confirmation, number of prescriptions, number of
medical records.

Below, two columns (60/40).

Left column, two cards:
1. "Lịch hẹn sắp tới" with a "Xem tất cả" link. Each row: a rounded square date tile showing
   day number over short month, then doctor name with a status tag, the doctor's specialty,
   and the time range. A chevron on the right.
2. "Bệnh án gần đây" with a "Xem tất cả" link. Each row: diagnosis text and the date, chevron.

Right column, three cards:
1. "Đơn thuốc gần nhất": the prescription date, then one bordered block per medicine showing
   medicine name with dosage, a quantity tag, and a line with frequency and duration. A
   full-width outline button below.
2. "Lần khám gần nhất": specialty, doctor name, date and time.
3. A call-to-action card with a short line of text and a primary button "Đặt lịch khám".

Only these data fields exist. Do not add vitals, lab results, messages or notifications.
```

### 4.4 Dashboard — Bác sĩ — `/`

```text
Design the doctor home screen.

Greeting heading with today's date.

Three summary tiles: today's visit count (teal, featured), waiting to be examined, already
examined today. The waiting tile is highlighted amber when at least one visit is ready.

One wide card "Lịch khám hôm nay" listing today's visits. Each row: start time, patient name,
a status tag, and the reason for the visit. Rows that are confirmed and whose start time has
passed show a primary "Khám" button on the right; other rows show no button.

Nothing else. The doctor has no messages, no lab queue, no earnings.
```

### 4.5 Dashboard — Lễ tân — `/`

```text
Design the receptionist home screen.

Greeting heading with today's date.

Three summary tiles: appointments awaiting confirmation (highlighted amber when above zero,
this is the number the receptionist acts on), today's appointment count, confirmed today.

Two columns (65/35).
Left: a card "Lịch hẹn chờ xác nhận" listing up to five pending bookings. Each row: patient
name, then date, time and doctor name underneath, with a primary "Xác nhận" button on the right.
Right: a card with a short line of text and a primary button "Đặt lịch hộ bệnh nhân".
```

### 4.6 Dashboard — Quản trị viên — `/`

```text
Design the admin home screen.

Greeting heading with today's date.

Three summary tiles: number of doctors, number of receptionists, number of locked accounts
(highlighted when above zero).

Two columns (65/35).
Left: a card "Nhân sự" listing staff. Each row: email, a role tag, a status tag, and the
creation date underneath.
Right: a card with two stacked buttons, "Quản lý nhân sự" and "Xếp lịch làm việc", plus an
information note explaining that the admin sees no appointment figures because appointment data
belongs to the receptionist and doctor roles.

Do not add revenue charts, patient totals or activity graphs: none of that data exists.
```

### 4.7 Danh sách bác sĩ — `/doctors`

```text
A directory screen. Page heading with a one-line description. A filter bar with two search
inputs: doctor name and specialty. Below, a table with columns: doctor name (bold), specialty,
phone, a truncated bio, and an action button on the right. For a patient the button reads
"Đặt lịch" and is primary; for other roles it reads "Xem chi tiết" and is secondary.
Paginated, with a page size selector.
```

### 4.8 Chi tiết bác sĩ và đặt lịch — `/doctors/:id`

```text
A detail screen with a back link above the heading.

Card 1 "Thông tin bác sĩ": specialty, phone, bio as a description list.
Card 2 "Lịch làm việc hàng tuần": one line per working day, showing the weekday as a tag and
the time range.
Card 3 "Đặt lịch khám", visible only to a patient:
- a date picker where weekends and days the doctor does not work are disabled
- after a date is chosen, the available 30-minute slots appear as a row of selectable pill
  buttons showing start times; if none are free, an empty state says so
- a multi-line reason field with a character counter
- a primary submit button

For non-patient roles, card 3 is replaced by a short note explaining they cannot book here.
```

### 4.9 Lịch hẹn của tôi — `/appointments` (bệnh nhân)

```text
A list screen. Page heading with a note that cancellation is only allowed at least two hours
before the appointment, and a primary "Đặt lịch khám" button on the right.

Filter bar: status dropdown, a date range picker, and a sort dropdown (newest or oldest first).

Table columns: date, time range, doctor (name over specialty), reason, status tag, and a red
"Hủy" button that appears only for pending or confirmed rows.

Cancelling opens a modal asking for a reason, with the two-hour rule repeated inside it.

Empty state offers a "Đặt lịch khám" button.
```

### 4.10 Bệnh án của tôi — `/medical-records` (bệnh nhân)

```text
A stacked-card screen, not a table. Page heading, then a sort dropdown.
One card per visit, titled with the visit date. Inside: a description list with diagnosis,
symptoms, treatment and notes. Below a divider labelled "Đơn thuốc", either a compact table of
prescribed medicines (name, dose, frequency, duration, quantity, instruction) or a line saying
the visit produced no prescription.
Simple previous/next pagination at the bottom.
```

### 4.11 Đơn thuốc của tôi — `/prescriptions` (bệnh nhân)

```text
Stacked cards, one per prescription, titled with the prescription date. Optional note line,
then a compact table of medicines with columns: name, dose, frequency, duration, quantity,
instruction. Previous/next pagination.
```

### 4.12 Hồ sơ bệnh nhân — `/profile`

```text
A profile screen. Page heading. One card showing the email and account status as read-only
text with a note that they cannot be changed here, followed by an editable form: full name
(required), phone, date of birth (future dates disabled), gender, address. Primary save button.
```

### 4.13 Lịch khám của bác sĩ — `/doctor/appointments`

```text
A list screen. Page heading with a note that the examine button only appears for confirmed
visits whose time has arrived.
Filter bar: date picker and status dropdown.
Table columns: date over time range, patient name, reason, status tag, and two buttons on the
right — a primary "Khám" (only on eligible rows) and a secondary "Bệnh án cũ" on every row.
```

### 4.14 Khám bệnh — `/doctor/appointments/:id/examine`

```text
A two-step working screen with a back link.

Card at the top: appointment details (patient, date and time, reason, status tag).

Card "1. Bệnh án": before it is written, a warning banner saying that saving also completes the
appointment and cannot be undone, then a form with symptoms, diagnosis (required), treatment
and notes, all multi-line with character counters, and a primary save button. After it is
written, the same card shows the saved content as a read-only description list.

Card "2. Đơn thuốc": disabled with a hint until the medical record exists. Then a repeatable
group of medicine rows, each in its own small bordered card numbered "Thuốc 1", "Thuốc 2" with
a remove icon: a medicine dropdown with search, and four short fields on one line for dose,
frequency, duration and quantity, plus a wider instruction field. A dashed full-width "Thêm
thuốc" button adds another. Below, a prescription-level note field and a primary save button.
After saving, the card shows the prescription as a read-only table.
```

### 4.15 Lịch sử bệnh án bệnh nhân — `/doctor/patients/:id`

```text
Back link, page heading with a note that a doctor only sees patients they have treated.
Stacked cards, one per visit, titled with the date, each showing diagnosis, symptoms,
treatment and notes. Previous/next pagination.
If access is denied, show a warning banner instead of the list.
```

### 4.16 Hồ sơ bác sĩ — `/doctor/profile`

```text
Three cards.
1. "Thông tin do quản trị viên quản lý": email, specialty, licence number, account status as a
   read-only description list, with a note to contact the admin to change them.
2. "Thông tin tôi tự cập nhật": an editable form with full name, phone and bio, plus a save button.
3. "Lịch làm việc hàng tuần": a read-only table of weekday and time range, with a note that the
   admin sets it.
```

### 4.17 Quản lý lịch hẹn — `/receptionist/appointments`

```text
A list screen. Page heading with a note that a receptionist may cancel even close to the
appointment time, unlike a patient, and a primary "Đặt lịch hộ bệnh nhân" button on the right.
Filter bar: date picker, doctor dropdown with search, status dropdown.
Table columns: date over time range, patient name, doctor (name over specialty), reason,
status tag, and on the right a primary "Xác nhận" button on pending rows and a red "Hủy" button
on pending or confirmed rows.
Cancelling opens a modal asking for a reason.
```

### 4.18 Đặt lịch hộ bệnh nhân — `/receptionist/book`

```text
A two-step screen with a back link.

Card "1. Chọn bệnh nhân": an information banner explaining that only patients who already have
an account can be found, then two search inputs (name, phone) and a compact table of results
with columns full name, phone, date of birth, gender, and a "Chọn" button. Once selected, the
card collapses to a single line showing the chosen patient with a tag and a button to pick
someone else.

Card "2. Chọn lịch khám": disabled until a patient is chosen. Then a doctor dropdown with
search, a date picker that disables days the doctor does not work, a row of selectable time
slot pills, a reason field, and a primary submit button showing the patient's name.
```

### 4.19 Quản lý nhân sự — `/admin/staff`

```text
A list screen. Page heading with a note that accounts are locked rather than deleted so history
is kept, and two buttons on the right: primary "Thêm bác sĩ" and secondary "Thêm lễ tân".
Filter bar: role dropdown and status dropdown.
Table columns: email, role tag, status tag, creation date, and a "Khóa" or "Mở khóa" button.
Two modals: creating a doctor collects email, temporary password, full name, phone, specialty,
licence number and bio; creating a receptionist collects only email and temporary password,
with a note explaining that the role has no profile.
```

### 4.20 Lịch làm việc — `/admin/schedules`

```text
Page heading with a note that the schedule repeats weekly and that 30-minute slots are generated
from it. A doctor dropdown with search at the top. Once a doctor is chosen, a primary "Thêm ca
làm việc" button and a table with columns weekday, time range, and edit and delete buttons.
Deleting asks for confirmation and warns that a shift with upcoming appointments cannot be removed.
A modal for adding or editing a shift: weekday dropdown, start time and end time pickers.
```

### 4.21 Trang không tồn tại — `*`

```text
A centred 404 result page with a short Vietnamese message and a primary button back to the home
screen.
```

---

## 5. Khung layout dùng chung

```text
All signed-in screens share one shell:
- Left sidebar, dark, fixed width, collapsing to a drawer below 992px. At the top a brand mark:
  a pulse-line icon in a rounded blue tile plus the product name. Below, the navigation menu,
  which differs per role.
- Top bar, white, height 56px, content aligned right: the user's name with the role underneath,
  and a circular avatar showing two initials on a teal background. Clicking opens a dropdown
  with a single "Đăng xuất" item.
- Content area with 24px margin.

Menu per role:
- PATIENT: Tổng quan, Tìm bác sĩ, Lịch hẹn của tôi, Bệnh án, Đơn thuốc, Hồ sơ của tôi
- DOCTOR: Tổng quan, Lịch khám của tôi, Hồ sơ của tôi, Danh sách bác sĩ
- RECEPTIONIST: Tổng quan, Quản lý lịch hẹn, Danh sách bác sĩ
- ADMIN: Tổng quan, Quản lý nhân sự, Lịch làm việc, Danh sách bác sĩ
```

---

## 6. Quy tắc nghiệp vụ giao diện phải tôn trọng

Những ràng buộc này do backend áp đặt. Thiết kế nào vi phạm sẽ không code được:

```text
- Ca khám cố định 30 phút, sinh ra từ lịch làm việc hàng tuần của bác sĩ.
  Giao diện chọn giờ phải là danh sách ca có sẵn, KHÔNG phải ô nhập giờ tự do.
- Bệnh nhân chỉ hủy được trước giờ khám ít nhất 2 tiếng. Lễ tân không bị giới hạn này.
- Chỉ lịch "Chờ xác nhận" mới xác nhận được. Chỉ "Chờ xác nhận" và "Đã xác nhận" mới hủy được.
- Bác sĩ chỉ ghi bệnh án khi lịch đã "Đã xác nhận" VÀ đã tới giờ khám.
- Ghi bệnh án đồng thời chuyển lịch sang "Đã khám", không hoàn tác được.
- Mỗi bệnh án chỉ có tối đa một đơn thuốc.
- Bác sĩ chỉ xem được bệnh án của bệnh nhân mình đã từng khám.
- Chỉ bệnh nhân mới đặt được lịch cho chính mình. Lễ tân đặt hộ ở màn hình riêng.
- Bác sĩ không tự sửa được chuyên khoa và số giấy phép, chỉ quản trị viên đổi được.
- Quản trị viên không xem được lịch hẹn.
- Lễ tân chỉ tìm được bệnh nhân đã có tài khoản, không tạo được bệnh nhân mới.
```

---

## 7. Sau khi có thiết kế

Gửi ảnh thiết kế kèm tên màn hình. Người code sẽ:

1. Đối chiếu từng phần tử với dữ liệu API có thật.
2. Báo lại nếu thiết kế chứa thứ không dựng được, kèm phương án thay thế.
3. Code bằng component Ant Design tương ứng.

Đừng bỏ qua bước 2. Hai lần trước, thiết kế chứa tin nhắn, kết quả xét nghiệm và trạng thái
thuốc — nếu code theo nguyên bản thì màn hình sẽ hiển thị dữ liệu bịa.
