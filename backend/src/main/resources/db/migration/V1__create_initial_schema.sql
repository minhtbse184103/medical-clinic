CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(20),
    address VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT uk_patients_user_id UNIQUE (user_id),
    CONSTRAINT fk_patients_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE doctors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    specialty VARCHAR(120) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    bio TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT uk_doctors_user_id UNIQUE (user_id),
    CONSTRAINT uk_doctors_license_number UNIQUE (license_number),
    CONSTRAINT fk_doctors_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE doctor_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT fk_doctor_schedules_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT chk_doctor_schedule_time
        CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_doctor_schedules_doctor_day
    ON doctor_schedules (doctor_id, day_of_week);

CREATE TABLE appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    confirmed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    cancelled_by_user_id BIGINT NULL,
    cancel_reason VARCHAR(500) NULL,
    completed_at DATETIME NULL,
    active_doctor_slot VARCHAR(255)
        GENERATED ALWAYS AS (
            CASE
                WHEN status IN ('PENDING', 'CONFIRMED') THEN CONCAT(
                    doctor_id, '#',
                    DATE_FORMAT(appointment_date, '%Y-%m-%d'), '#',
                    TIME_FORMAT(start_time, '%H:%i:%s')
                )
                ELSE NULL
            END
        ) STORED,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_appointments_cancelled_by
        FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id),
    CONSTRAINT chk_appointments_time
        CHECK (start_time < end_time),
    CONSTRAINT uk_appointments_active_doctor_slot
        UNIQUE (active_doctor_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_appointments_doctor_date
    ON appointments (doctor_id, appointment_date);

CREATE INDEX idx_appointments_patient_date
    ON appointments (patient_id, appointment_date);

CREATE INDEX idx_appointments_date_status
    ON appointments (appointment_date, status);

CREATE TABLE medical_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id BIGINT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT uk_medical_records_appointment UNIQUE (appointment_id),
    CONSTRAINT fk_medical_records_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE medicines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(50),
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    medical_record_id BIGINT NOT NULL,
    notes VARCHAR(1000),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    CONSTRAINT uk_prescriptions_medical_record UNIQUE (medical_record_id),
    CONSTRAINT fk_prescriptions_medical_record
        FOREIGN KEY (medical_record_id) REFERENCES medical_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescription_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    quantity INT,
    instruction VARCHAR(500),

    CONSTRAINT fk_prescription_details_prescription
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    CONSTRAINT fk_prescription_details_medicine
        FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    CONSTRAINT chk_prescription_details_quantity
        CHECK (quantity IS NULL OR quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_prescription_details_prescription
    ON prescription_details (prescription_id);
