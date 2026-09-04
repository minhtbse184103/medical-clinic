# Current Project Status

Last updated: 2026-09-04

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

### Doctor discovery

- `GET /api/v1/doctors` is implemented for every authenticated MVP role.
- The endpoint supports pagination (`page`, `size`) and optional case-insensitive `specialty` and `name` filters.
- `GET /api/v1/doctors/{doctorId}` is implemented.
- Both endpoints only expose `ACTIVE` Doctor accounts and return public Doctor fields only; email, password data, license number, and internal User fields are excluded.
- Missing or inactive Doctor returns `404 DOCTOR_NOT_FOUND`.
- `DoctorQueryServiceTest` and `DoctorControllerTest` pass (6 tests total).

### Doctor schedule creation

- `POST /api/v1/doctors/{doctorId}/schedules` is implemented and requires role `ADMIN`.
- Schedule uses the weekly recurring model: `dayOfWeek`, `startTime`, and `endTime`.
- Bean Validation requires all three request fields; the service validates `startTime < endTime`.
- The service rejects overlapping schedules for the same Doctor and weekday, while adjacent periods are allowed.
- Invalid time range returns `400 DOCTOR_SCHEDULE_INVALID_TIME_RANGE`; an overlap returns `409 DOCTOR_SCHEDULE_OVERLAP`.
- `DoctorScheduleServiceTest` and `DoctorScheduleControllerTest` pass (7 tests total).

### Doctor schedule viewing

- `GET /api/v1/doctors/{doctorId}/schedules` is implemented for every authenticated MVP role.
- The endpoint only returns schedules of an `ACTIVE` Doctor; missing or inactive Doctor returns `404 DOCTOR_NOT_FOUND`.
- Schedules are returned in weekly order (`MONDAY` to `SUNDAY`), then by `startTime`.
- Doctor Schedule targeted tests now pass (10 tests total).

### Doctor schedule update

- `PUT /api/v1/doctors/{doctorId}/schedules/{scheduleId}` is implemented and requires role `ADMIN`.
- The service verifies that the Doctor exists and that the schedule belongs to that Doctor.
- Overlap validation excludes the schedule currently being updated.
- A schedule that does not belong to the Doctor returns `404 DOCTOR_SCHEDULE_NOT_FOUND`.
- Doctor Schedule targeted tests now pass (15 tests total).

### Available appointment slots

- `GET /api/v1/doctors/{doctorId}/available-slots?date=yyyy-MM-dd` is implemented for every authenticated MVP role.
- The service generates fixed 30-minute slots from the Doctor's weekly schedule for the requested date.
- Slots occupied by `PENDING` or `CONFIRMED` appointments are excluded; cancelled and completed appointments do not block a slot.
- Only future slots of an `ACTIVE` Doctor are returned. A past date returns an empty list.
- `Clock` is configured as a Spring bean so time-dependent service tests stay deterministic.
- `AvailableSlotServiceTest` and `AvailableSlotControllerTest` pass (5 tests total).

### Patient appointment booking

- `POST /api/v1/appointments` is implemented and requires role `PATIENT`.
- The Patient identity is derived exclusively from the JWT principal; the request only accepts `doctorId`, `appointmentDate`, `startTime`, and `reason`.
- The service creates a `PENDING` appointment with a fixed 30-minute duration in one transaction.
- It validates active Patient and Doctor accounts, a future date/time, weekly schedule membership, an existing Doctor slot, and a same-time Patient conflict.
- The final `saveAndFlush` lets the database active-slot unique constraint protect concurrent bookings; a uniqueness violation is returned as `409 APPOINTMENT_SLOT_ALREADY_BOOKED`.
- `AppointmentBookingServiceTest` and `AppointmentControllerTest` pass (7 tests total).

## API Documentation

`docs/07-rest-api-design.md` now defines that successful endpoints return endpoint-specific response DTOs, except endpoints explicitly designed as `204 No Content`.

## Verification

- Targeted controller and service tests for registration, login, refresh token, JWT-protected patient profile, and validation are passing.
- Run `mvn clean test` in a PowerShell session that has valid `DB_PASSWORD` and `JWT_SECRET` values before each milestone handoff.

## Next Task

Implement the Patient's own appointment list:

1. Read the Patient appointment-list sections of `docs/02`, `docs/03`, `docs/04`, and `docs/07`.
2. Complete the response DTO and pagination/filter contract for `GET /api/v1/appointments/me` if needed.
3. Implement the endpoint for role `PATIENT`, deriving the Patient identity exclusively from JWT authentication.
4. Support the documented optional `status`, `fromDate`, `toDate`, `page`, `size`, and `sort` parameters without exposing internal User data.
