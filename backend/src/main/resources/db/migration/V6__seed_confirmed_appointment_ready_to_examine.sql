-- One CONFIRMED appointment whose start time has already passed and which has no
-- Medical Record yet, so the Doctor screens have a visit ready to be examined.
--
-- MedicalRecordService requires exactly that combination: the appointment must belong to
-- the Doctor, be CONFIRMED, have reached its start time, and not already have a record.
-- Without this row the Doctor flow cannot be exercised at all on a fresh database, because
-- V5 seeds only a COMPLETED visit and a future PENDING one.
--
-- DEMO DATA ONLY. Remove or replace before any real deployment.
--
-- Same Monday anchor as V5, so it stays inside the Mon-Fri 08:00-11:30 schedule of
-- doctor LIC-DEMO-0001. MySQL DAYOFWEEK(): 1 = Sunday, 2 = Monday.

SET @last_monday = DATE_SUB(CURDATE(), INTERVAL (((DAYOFWEEK(CURDATE()) + 5) % 7) + 7) DAY);

INSERT INTO appointments (
    patient_id, doctor_id, appointment_date, start_time, end_time, status, reason,
    confirmed_at, created_at, updated_at
)
SELECT p.id, d.id, @last_monday, '10:00:00', '10:30:00', 'CONFIRMED', 'Dau dau keo dai mot tuan',
       TIMESTAMP(DATE_SUB(@last_monday, INTERVAL 1 DAY), '09:00:00'),
       TIMESTAMP(DATE_SUB(@last_monday, INTERVAL 3 DAY), '15:00:00'),
       TIMESTAMP(DATE_SUB(@last_monday, INTERVAL 1 DAY), '09:00:00')
FROM patients p
JOIN users pu ON pu.id = p.user_id
JOIN doctors d ON d.license_number = 'LIC-DEMO-0001'
WHERE pu.email = 'patient2@clinic.local'
  AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = d.id AND a.appointment_date = @last_monday AND a.start_time = '10:00:00'
  );
