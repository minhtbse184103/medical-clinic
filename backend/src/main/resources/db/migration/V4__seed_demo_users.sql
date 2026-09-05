-- Demo accounts for local development and the frontend.
-- Without an ADMIN there is no way to create Doctors through the API, because
-- POST /api/v1/admin/doctors requires role ADMIN. That would leave a fresh clone unusable.
--
-- Every account below uses the same demo password: Demo@12345
-- The stored values are BCrypt hashes of that password. These are DEMO credentials only;
-- change or remove them before any real deployment.
--
-- Each insert is guarded so re-running against a partially seeded database stays safe.

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'admin@clinic.local', '$2a$10$5qoxidtctNK4cALs4cRKMOqAFrihJ0W405vmK5w/owv/zne3AfnMy', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@clinic.local');

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'receptionist@clinic.local', '$2a$10$f0h0Xs/D6W9CXe6Md.3Gg.S6hQMQpchNaLmBItHUfPmzxyAXNxScq', 'RECEPTIONIST', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'receptionist@clinic.local');

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'doctor1@clinic.local', '$2a$10$DrEi1HVq8MbVg2r/kxrpReMtopKyzhmoH/MsX.eJzARBde5Bts9lS', 'DOCTOR', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor1@clinic.local');

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'doctor2@clinic.local', '$2a$10$2TNcpGIo.FTni/9gRidz/O4CJCQ9GcxihTuPj2fPBh1MRmQfajwmu', 'DOCTOR', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor2@clinic.local');

INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
SELECT 'patient@clinic.local', '$2a$10$fe2rFabmUxaYmb7upw.gReN3c.rMdg4/vQQQoMJdOi.JOJiSA.GCu', 'PATIENT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patient@clinic.local');

-- Profile rows. ADMIN and RECEPTIONIST have no profile table in the MVP.

INSERT INTO doctors (user_id, full_name, phone, specialty, license_number, bio, created_at, updated_at)
SELECT u.id, 'Nguyen Van An', '0900000001', 'Nội tổng quát', 'LIC-DEMO-0001', 'Bác sĩ nội tổng quát (tài khoản demo).', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'doctor1@clinic.local'
  AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id);

INSERT INTO doctors (user_id, full_name, phone, specialty, license_number, bio, created_at, updated_at)
SELECT u.id, 'Tran Thi Binh', '0900000002', 'Nhi khoa', 'LIC-DEMO-0002', 'Bác sĩ nhi khoa (tài khoản demo).', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'doctor2@clinic.local'
  AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = u.id);

INSERT INTO patients (user_id, full_name, phone, date_of_birth, gender, address, created_at, updated_at)
SELECT u.id, 'Le Van Cuong', '0900000003', '1995-05-20', 'MALE', 'Ha Noi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'patient@clinic.local'
  AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id = u.id);

-- Weekly schedules so the available-slots endpoint returns data during development.
-- Doctor 1 works Monday to Friday, Doctor 2 works Monday, Wednesday and Friday.

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, created_at, updated_at)
SELECT d.id, day.name, '08:00:00', '11:30:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctors d
JOIN (
    SELECT 'MONDAY' AS name
    UNION ALL SELECT 'TUESDAY'
    UNION ALL SELECT 'WEDNESDAY'
    UNION ALL SELECT 'THURSDAY'
    UNION ALL SELECT 'FRIDAY'
) day
WHERE d.license_number = 'LIC-DEMO-0001'
  AND NOT EXISTS (
      SELECT 1 FROM doctor_schedules s
      WHERE s.doctor_id = d.id AND s.day_of_week = day.name AND s.start_time = '08:00:00'
  );

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, created_at, updated_at)
SELECT d.id, day.name, '13:30:00', '17:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM doctors d
JOIN (
    SELECT 'MONDAY' AS name
    UNION ALL SELECT 'WEDNESDAY'
    UNION ALL SELECT 'FRIDAY'
) day
WHERE d.license_number = 'LIC-DEMO-0002'
  AND NOT EXISTS (
      SELECT 1 FROM doctor_schedules s
      WHERE s.doctor_id = d.id AND s.day_of_week = day.name AND s.start_time = '13:30:00'
  );
