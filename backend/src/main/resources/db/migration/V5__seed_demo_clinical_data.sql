-- Demo clinical data, so a fresh database does not open on empty screens:
-- extra patients for the Receptionist lookup, one finished visit with its Medical Record
-- and Prescription, and one upcoming appointment waiting to be confirmed.
--
-- All accounts use the same demo password as V4: Demo@12345
-- DEMO DATA ONLY. Remove or replace before any real deployment.
--
-- Dates are derived from CURDATE() so they stay meaningful whenever the migration runs.
-- MySQL DAYOFWEEK(): 1 = Sunday, 2 = Monday, so ((DAYOFWEEK + 5) % 7) is "days since Monday".
-- Both anchors land on a Monday because doctor LIC-DEMO-0001 works Monday to Friday, 08:00-11:30.

SET @last_monday  = DATE_SUB(CURDATE(), INTERVAL (((DAYOFWEEK(CURDATE()) + 5) % 7) + 7) DAY);
SET @next_monday  = DATE_ADD(CURDATE(), INTERVAL (7 - ((DAYOFWEEK(CURDATE()) + 5) % 7)) DAY);

-- Extra patients, so searching by name or phone returns more than a single row.

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'patient2@clinic.local', '$2a$10$fe2rFabmUxaYmb7upw.gReN3c.rMdg4/vQQQoMJdOi.JOJiSA.GCu', 'PATIENT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient2@clinic.local');

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'patient3@clinic.local', '$2a$10$fe2rFabmUxaYmb7upw.gReN3c.rMdg4/vQQQoMJdOi.JOJiSA.GCu', 'PATIENT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient3@clinic.local');

INSERT INTO patients (user_id, full_name, phone, date_of_birth, gender, address, created_at, updated_at)
SELECT u.id, 'Pham Thi Dung', '0900000004', '1988-11-02', 'FEMALE', 'Da Nang', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'patient2@clinic.local'
  AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id = u.id);

INSERT INTO patients (user_id, full_name, phone, date_of_birth, gender, address, created_at, updated_at)
SELECT u.id, 'Hoang Minh Duc', '0900000005', '2011-03-15', 'MALE', 'Hue', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'patient3@clinic.local'
  AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id = u.id);

-- A finished visit: COMPLETED appointment, its Medical Record and its Prescription.
-- This gives the Patient history screens and the Doctor history screen something to show.

INSERT INTO appointments (
    patient_id, doctor_id, appointment_date, start_time, end_time, status, reason,
    confirmed_at, completed_at, created_at, updated_at
)
SELECT p.id, d.id, @last_monday, '09:00:00', '09:30:00', 'COMPLETED', 'Ho va sot nhe ba ngay',
       TIMESTAMP(@last_monday, '08:00:00'), TIMESTAMP(@last_monday, '09:30:00'),
       TIMESTAMP(DATE_SUB(@last_monday, INTERVAL 2 DAY), '10:00:00'), TIMESTAMP(@last_monday, '09:30:00')
FROM patients p
JOIN users pu ON pu.id = p.user_id
JOIN doctors d ON d.license_number = 'LIC-DEMO-0001'
WHERE pu.email = 'patient@clinic.local'
  AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = d.id AND a.appointment_date = @last_monday AND a.start_time = '09:00:00'
  );

INSERT INTO medical_records (appointment_id, symptoms, diagnosis, treatment, notes, created_at, updated_at)
SELECT a.id,
       'Ho khan, sot 38 do C, dau hong',
       'Viem hong cap',
       'Nghi ngoi, uong nhieu nuoc, dung thuoc theo don',
       'Tai kham neu sot keo dai qua ba ngay',
       TIMESTAMP(@last_monday, '09:30:00'), TIMESTAMP(@last_monday, '09:30:00')
FROM appointments a
WHERE a.appointment_date = @last_monday
  AND a.start_time = '09:00:00'
  AND a.status = 'COMPLETED'
  AND NOT EXISTS (SELECT 1 FROM medical_records m WHERE m.appointment_id = a.id);

INSERT INTO prescriptions (medical_record_id, notes, created_at, updated_at)
SELECT m.id, 'Uong sau an', TIMESTAMP(@last_monday, '09:35:00'), TIMESTAMP(@last_monday, '09:35:00')
FROM medical_records m
JOIN appointments a ON a.id = m.appointment_id
WHERE a.appointment_date = @last_monday
  AND a.start_time = '09:00:00'
  AND NOT EXISTS (SELECT 1 FROM prescriptions pr WHERE pr.medical_record_id = m.id);

INSERT INTO prescription_details (prescription_id, medicine_id, dosage, frequency, duration, quantity, instruction)
SELECT pr.id, med.id, '500mg', '3 lan/ngay', '5 ngay', 15, 'Uong sau an'
FROM prescriptions pr
JOIN medical_records m ON m.id = pr.medical_record_id
JOIN appointments a ON a.id = m.appointment_id
JOIN medicines med ON med.name = 'Paracetamol'
WHERE a.appointment_date = @last_monday
  AND a.start_time = '09:00:00'
  AND NOT EXISTS (
      SELECT 1 FROM prescription_details pd
      WHERE pd.prescription_id = pr.id AND pd.medicine_id = med.id
  );

INSERT INTO prescription_details (prescription_id, medicine_id, dosage, frequency, duration, quantity, instruction)
SELECT pr.id, med.id, '500mg', '2 lan/ngay', '7 ngay', 14, 'Uong du lieu trinh'
FROM prescriptions pr
JOIN medical_records m ON m.id = pr.medical_record_id
JOIN appointments a ON a.id = m.appointment_id
JOIN medicines med ON med.name = 'Amoxicillin'
WHERE a.appointment_date = @last_monday
  AND a.start_time = '09:00:00'
  AND NOT EXISTS (
      SELECT 1 FROM prescription_details pd
      WHERE pd.prescription_id = pr.id AND pd.medicine_id = med.id
  );

-- One upcoming PENDING appointment, so the Receptionist screen has something to confirm
-- without having to book one first.

INSERT INTO appointments (
    patient_id, doctor_id, appointment_date, start_time, end_time, status, reason,
    created_at, updated_at
)
SELECT p.id, d.id, @next_monday, '08:30:00', '09:00:00', 'PENDING', 'Kham suc khoe dinh ky',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM patients p
JOIN users pu ON pu.id = p.user_id
JOIN doctors d ON d.license_number = 'LIC-DEMO-0001'
WHERE pu.email = 'patient2@clinic.local'
  AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = d.id AND a.appointment_date = @next_monday AND a.start_time = '08:30:00'
  );
