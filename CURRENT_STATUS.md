# Current Project Status

Last updated: 2026-09-03

## Repository

Project path:
`D:\project-java\medical-clinic\medical-clinic`

Git branch: `main`

Canonical Java package:
`com.tranminh.medicalclinic`

## Environment Verified

- Java 21.0.9 LTS
- MySQL Server 8.0.44
- Database: `medical_clinic`
- `DB_PASSWORD` and `JWT_SECRET` are supplied through environment variables.
- MySQL Workbench confirmed the schema and Postman confirmed patient registration end-to-end.

`DB_PASSWORD` must remain an environment variable. Never place its real value in source code, documentation, commits, or chat.

## Database and Flyway

- Hibernate uses `ddl-auto: validate`.
- Flyway owns schema evolution.
- Maven dependencies use `spring-boot-starter-flyway` and `flyway-mysql`.
- `V1__create_initial_schema.sql` was applied successfully.
- Schema contains the 9 MVP business tables and `flyway_schema_history`.
- The generated active doctor-slot column and its unique constraint were accepted by MySQL 8.0.44.

## Implemented Code

### Structure

The source structure follows `AGENTS.md`:

```text
com.tranminh.medicalclinic/
├── config/
├── controller/
├── dto/request/
├── dto/response/
├── entity/
├── enums/
├── exception/
├── repository/
├── security/
└── service/
```

### Persistence

- All 9 JPA entities and required enums are mapped and Hibernate-validated.
- Repository layer is implemented for User, Patient, Doctor, DoctorSchedule, Appointment, MedicalRecord, Medicine, Prescription, and PrescriptionDetail.

### Patient registration

- `POST /api/v1/auth/register` is implemented and public.
- Request: `RegisterPatientRequest`.
- Response: `RegisterPatientResponse`; password/password hash are never returned.
- `RegistrationService` checks duplicate email, hashes passwords with BCrypt, creates User + Patient in one transaction, and returns the response DTO.
- `AuthController`, `SecurityConfig`, `PasswordEncoderConfig`, and global error handling are in place.
- Duplicate email returns `409 EMAIL_ALREADY_EXISTS`; invalid input returns `400 VALIDATION_ERROR`.
- Postman registration test successfully created data in MySQL.

### Patient profile foundation

- `UpdatePatientProfileRequest` and `PatientProfileResponse` exist.
- `PatientProfileService` has read/update methods with unit tests.
- `GET/PUT /api/v1/patients/me` are implemented for role `PATIENT`.
- The authenticated user ID is read from JWT `SecurityContext`, never from a client-provided user ID.

### JWT authentication

- `POST /api/v1/auth/login` is public and returns `LoginResponse` with an access token and refresh token.
- `POST /api/v1/auth/refresh` is public and returns a rotated token pair for a valid refresh token.
- JWT uses a Base64 signing secret from `JWT_SECRET`; no secret is stored in the repository.
- Security is stateless. `JwtAuthenticationFilter` validates Bearer access tokens and puts the user ID and role into `SecurityContext`.
- Invalid login credentials return `401 INVALID_CREDENTIALS`; inactive accounts return `403 ACCOUNT_INACTIVE`; invalid refresh tokens return `401 INVALID_REFRESH_TOKEN`.
- Authentication and authorization failures from Spring Security return JSON error responses.
- Refresh tokens are stateless in the MVP, so individual logout/revocation is not implemented yet.

### Admin doctor management

- `POST /api/v1/admin/doctors` is implemented and requires role `ADMIN`.
- `AdminDoctorService` creates a `User` with role `DOCTOR` and its `Doctor` profile in one transaction.
- Email and doctor license number uniqueness are checked before persistence.
- Duplicate license number returns `409 DOCTOR_LICENSE_NUMBER_ALREADY_EXISTS`.
- Unit and controller tests cover success, validation, duplicate license, and authorization.
- Postman verified the full flow: ADMIN login followed by doctor creation returns `201 Created`.

## API Documentation

`docs/07-rest-api-design.md` now defines that successful endpoints return endpoint-specific response DTOs, except endpoints explicitly designed as `204 No Content`.

## Verification

- Targeted controller and service tests for registration, login, refresh token, JWT-protected patient profile, and validation are passing.
- Run `mvn clean test` in a PowerShell session that has valid `DB_PASSWORD` and `JWT_SECRET` values before each milestone handoff.

## Next Task

Implement authenticated doctor discovery:

1. Read the Doctor API sections of `docs/02`, `docs/03`, and `docs/07`.
2. Complete the response contract for doctor list/detail in `docs/07` before implementation.
3. Implement paginated `GET /api/v1/doctors` with `specialty` and `name` filters, then `GET /api/v1/doctors/{doctorId}`.
4. Allow all authenticated roles to view doctors; do not expose email, password data, or internal User fields.
