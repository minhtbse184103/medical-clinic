# Medical Clinic Management System

Monorepo for a Medical Clinic Management System portfolio project.

## Repository structure

```text
medical-clinic/
├── backend/     # Spring Boot REST API
├── frontend/    # Frontend application (planned)
└── docs/        # Project and API design documents
```

## Backend

```powershell
cd backend
mvn spring-boot:run
```

Swagger UI is available at `http://localhost:8080/swagger-ui.html` when the backend is running.

Database and JWT secrets are provided through environment variables. See `CURRENT_STATUS.md` and the documents in `docs/` before starting development.

### Demo accounts

Flyway migration `V4__seed_demo_users.sql` seeds the accounts below so a fresh clone can exercise every role. Without a seeded ADMIN there is no way to create Doctors, because `POST /api/v1/admin/doctors` requires role `ADMIN`.

| Email | Role |
|---|---|
| `admin@clinic.local` | ADMIN |
| `receptionist@clinic.local` | RECEPTIONIST |
| `doctor1@clinic.local` | DOCTOR |
| `doctor2@clinic.local` | DOCTOR |
| `patient@clinic.local` | PATIENT |
| `patient2@clinic.local` | PATIENT |
| `patient3@clinic.local` | PATIENT |

All of them use the password `Demo@12345`. **These are development credentials only — change or remove them before any real deployment.**

`V5__seed_demo_clinical_data.sql` adds content so the screens are not empty on a fresh database: two doctors with weekly schedules, one finished visit with its medical record and prescription, and one upcoming appointment waiting for the receptionist to confirm.

### Resetting the database

Dropping and recreating the schema replays every migration from scratch:

```powershell
mysql -u root -p -e "DROP DATABASE IF EXISTS medical_clinic; CREATE DATABASE medical_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

Stop the backend first, then start it again to let Flyway rebuild the schema and reseed the demo data.

### Frontend development

The API allows browser requests from `http://localhost:5173` by default. Override with the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated) when the frontend runs elsewhere.
