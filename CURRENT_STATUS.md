# Current Project Status

Last updated: 2026-09-04

## Repository

Project path:
`D:\project-java\medical-clinic\medical-clinic\backend`

Git branch: `main`

Canonical Java package:
`com.tranminh.medicalclinic`

Repository layout:

```text
medical-clinic/
├── backend/   Spring Boot REST API
├── frontend/  reserved for the future frontend application
└── docs/      shared project documentation
```

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
- `V2__seed_initial_medicines.sql` was applied successfully and adds four small demo catalogue entries: Paracetamol, Ibuprofen, Amoxicillin, and Vitamin C.
- `V3__add_refresh_tokens.sql` was applied successfully and stores refresh-token identifiers for rotation and logout revocation.
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

- All 9 domain JPA entities plus the technical `RefreshToken` entity and required enums are mapped and Hibernate-validated.
- Repository layer is implemented for User, Patient, Doctor, DoctorSchedule, Appointment, MedicalRecord, Medicine, Prescription, PrescriptionDetail, and RefreshToken.

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
- `POST /api/v1/auth/logout` is public, accepts `RefreshTokenRequest`, and returns `204 No Content`.
- JWT uses a Base64 signing secret from `JWT_SECRET`; no secret is stored in the repository.
- Security is stateless. `JwtAuthenticationFilter` validates Bearer access tokens and puts the user ID and role into `SecurityContext`.
- Invalid login credentials return `401 INVALID_CREDENTIALS`; inactive accounts return `403 ACCOUNT_INACTIVE`; invalid refresh tokens return `401 INVALID_REFRESH_TOKEN`.
- Authentication and authorization failures from Spring Security return JSON error responses.
- Refresh-token `jti` values are stored in `refresh_tokens`; the token itself is never stored. Logout revokes its refresh token and refresh rotates it in one transaction. Existing stateless access tokens remain valid until their 15-minute expiry.

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

### Doctor schedule deletion

- `DELETE /api/v1/doctors/{doctorId}/schedules/{scheduleId}` is implemented and requires role `ADMIN`.
- A weekly schedule is hard-deleted because it is future configuration, not clinical history.
- Deletion is rejected with `409 DOCTOR_SCHEDULE_HAS_ACTIVE_APPOINTMENTS` when that schedule covers a `PENDING` or `CONFIRMED` appointment that has not finished yet; `COMPLETED` and `CANCELLED` appointments do not block deletion.
- The endpoint returns `204 No Content` on success.
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

### Patient appointment list

- `GET /api/v1/appointments/me` is implemented and requires role `PATIENT`.
- The endpoint derives the Patient identity exclusively from JWT authentication and never accepts a `patientId` from the client.
- It supports optional `status`, `fromDate`, `toDate`, `page`, `size`, and documented `appointmentDate,asc|desc` sorting.
- The response is paginated and exposes appointment data plus public Doctor display fields only.
- Invalid date ranges and unsupported sort values return explicit `400` API errors.
- `PatientAppointmentQueryServiceTest` and `AppointmentControllerTest` pass (7 tests total).

### Doctor appointment list

- `GET /api/v1/doctor/appointments` is implemented and requires role `DOCTOR`.
- The endpoint derives the Doctor identity exclusively from JWT authentication and accepts optional `date`, `status`, `page`, and `size` filters.
- Results are ordered by appointment date and start time, ascending.
- The response exposes only `patientId` and Patient full name for clinical identification; Patient contact/profile fields and internal User data are excluded.
- `DoctorAppointmentQueryServiceTest` and `DoctorAppointmentControllerTest` pass (4 tests total).

### Receptionist appointment list

- `GET /api/v1/receptionist/appointments` is implemented and requires role `RECEPTIONIST`.
- The endpoint supports optional `date`, `doctorId`, `patientId`, `status`, `page`, and `size` filters.
- Results are ordered by appointment date and start time, ascending.
- The response includes only operational Patient/Doctor identifiers and names; contact/profile fields and internal User data are excluded.
- `ReceptionistAppointmentControllerTest` passes (2 tests total).

### Appointment confirmation and cancellation

- `POST /api/v1/appointments/{appointmentId}/confirm` is implemented for `RECEPTIONIST`; only `PENDING` appointments can transition to `CONFIRMED` and receive `confirmedAt`.
- Patient cancellation endpoint enforces ownership, `PENDING`/`CONFIRMED` status, and a 2-hour deadline.
- Receptionist cancellation endpoint accepts the same cancellable statuses but has no 2-hour deadline.
- Both cancellation flows retain the appointment history and store cancellation reason, time, and actor.
- Targeted controller and service tests for confirmation and cancellation pass.

### Medical record creation and appointment completion

- `POST /api/v1/appointments/{appointmentId}/medical-record` is implemented and requires role `DOCTOR`.
- The Doctor identity is derived from JWT; the appointment must belong to that Doctor, be `CONFIRMED`, have reached its start time, and not already have a Medical Record.
- MedicalRecord creation and the `COMPLETED` Appointment transition are executed in one transaction.
- `MedicalRecordServiceTest` and `MedicalRecordControllerTest` pass (5 tests total).

### Prescription creation

- `POST /api/v1/medical-records/{medicalRecordId}/prescription` is implemented and requires role `DOCTOR`.
- The service verifies Medical Record ownership through its Appointment, enforces one Prescription per Medical Record, and accepts only active Medicines.
- Prescription and all PrescriptionDetails are persisted in one transaction.
- `PrescriptionServiceTest` and `PrescriptionControllerTest` pass (6 tests total).

### Patient medical history

- `GET /api/v1/patients/me/medical-records` is implemented and requires role `PATIENT`.
- The Patient identity is derived exclusively from JWT; the endpoint never accepts a patient ID from the client.
- Results are paginated and support only `createdAt,asc|desc` sorting, defaulting to `createdAt,desc`.
- The response returns endpoint-specific Medical Record data without internal User fields.
- `PatientMedicalRecordQueryServiceTest` and `PatientMedicalRecordControllerTest` cover pagination/query behavior and authorization.

### Doctor access to Patient medical history

- `GET /api/v1/doctor/patients/{patientId}/medical-records` is implemented and requires role `DOCTOR`.
- The service requires an active Doctor profile and an existing Patient profile.
- Doctor access is allowed only if at least one Appointment exists between the authenticated Doctor and the requested Patient; role alone is insufficient.
- Results are paginated, ordered by `createdAt` descending, and expose only necessary Medical Record fields.
- `DoctorPatientMedicalRecordQueryServiceTest` and `DoctorPatientMedicalRecordControllerTest` pass (4 tests total).

### Patient prescription history

- `GET /api/v1/patients/me/prescriptions` is implemented and requires role `PATIENT`.
- The Patient identity is derived exclusively from JWT and only that Patient's Prescriptions are returned.
- The paginated response includes Prescription details with medicine names so the frontend can display a prescription without a separate medicine lookup.
- Prescription details are loaded in one batch for the response page to avoid an N+1 query pattern.
- `PatientPrescriptionQueryServiceTest` and `PatientPrescriptionControllerTest` pass (4 tests total).

### Prescription detail view

- `GET /api/v1/medical-records/{medicalRecordId}/prescription` is implemented for `PATIENT` and `DOCTOR`.
- The service applies ownership by actor: Patient must own the Medical Record; Doctor must own the related Appointment. ADMIN and RECEPTIONIST cannot access this endpoint.
- The response includes medicine names and dosage details for direct frontend display.
- `PrescriptionQueryServiceTest` and `PrescriptionQueryControllerTest` pass (5 tests total).

### Doctor medicine discovery

- `GET /api/v1/medicines` is implemented and requires an `ACTIVE` `DOCTOR` profile.
- Optional `name` and `active` filters are supported with pagination; results are ordered by medicine name ascending.
- The response contains only Medicine catalogue fields required when selecting a medicine for a Prescription.
- `MedicineQueryServiceTest` and `MedicineControllerTest` pass (4 tests total).

### Receptionist appointment creation

- `POST /api/v1/receptionist/appointments` is implemented for `RECEPTIONIST`.
- The request explicitly identifies the Patient; the service reuses the Patient booking rules and creates a `PENDING` Appointment.
- `AppointmentBookingServiceTest` and `ReceptionistAppointmentControllerTest` cover the receptionist booking flow.

### Admin staff management

- `POST /api/v1/admin/receptionists` creates an `ACTIVE` `RECEPTIONIST` User with a BCrypt-hashed temporary password.
- `GET /api/v1/admin/staff` lists only `DOCTOR` and `RECEPTIONIST` users with optional role/status filters and pagination.
- `POST /api/v1/admin/users/{userId}/activate` and `/deactivate` change staff status without deleting historical data.
- `AdminStaffServiceTest` and `AdminStaffControllerTest` cover creation, deactivation, and authorization.

## API Documentation

`docs/07-rest-api-design.md` now defines that successful endpoints return endpoint-specific response DTOs, except endpoints explicitly designed as `204 No Content`.

### Swagger UI

- `springdoc-openapi-starter-webmvc-ui` is configured for interactive API testing.
- Swagger UI is public at `http://localhost:8080/swagger-ui.html`; the generated OpenAPI document is at `/v3/api-docs`.
- The UI supports JWT Bearer authorization through its `Authorize` button.

## Verification

- Targeted controller and service tests for registration, login, refresh token, JWT-protected patient profile, and validation are passing.
- Run `mvn clean test` in a PowerShell session that has valid `DB_PASSWORD` and `JWT_SECRET` values before each milestone handoff.

## Next Task

Verify Flyway V3 and the completed core MVP API flow against MySQL/Postman, then commit the current focused milestone.
