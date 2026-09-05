# Current Project Status

Last updated: 2026-09-05

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
├── frontend/  React single-page application
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
- `V6__seed_confirmed_appointment_ready_to_examine.sql` was applied successfully and adds one `CONFIRMED` Appointment whose start time has passed and which has no Medical Record. `MedicalRecordService` requires exactly that combination, so without this row the Doctor flow could not be exercised at all on a fresh database.
- `V5__seed_demo_clinical_data.sql` was applied successfully and seeds two more Patients, one finished visit (COMPLETED Appointment plus its Medical Record and Prescription) and one upcoming `PENDING` Appointment, so a fresh database does not open on empty screens. Its dates are derived from `CURDATE()` and always land on a Monday, matching the Mon-Fri schedule of doctor `LIC-DEMO-0001`, so they stay valid whenever the migration runs.
- `V4__seed_demo_users.sql` was applied successfully and seeds the demo accounts (1 ADMIN, 1 RECEPTIONIST, 2 DOCTOR with profiles and weekly schedules, 1 PATIENT). Without a seeded ADMIN there was no way to create Doctors through the API, because `POST /api/v1/admin/doctors` requires role `ADMIN`. All demo accounts share the password `Demo@12345`; they are development credentials and must be changed or removed before any real deployment.
- Schema contains the 9 MVP business tables and `flyway_schema_history`.
- On 2026-09-05 the development database was dropped and recreated from scratch to clear accumulated manual test data, including a Patient profile that had been attached to an `ADMIN` User. All five migrations replayed cleanly on the empty schema, which also confirms the migration chain works from zero.
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

### Frontend enablement

These four changes were made specifically so a separate frontend application can consume the API.

- CORS is configured in `CorsConfig` and enabled in `SecurityConfig`. Allowed origins come from `app.cors.allowed-origins` (env `CORS_ALLOWED_ORIGINS`, default `http://localhost:5173`). Only `Authorization` and `Content-Type` headers are allowed and credentialed requests stay disabled, because the API authenticates with Bearer tokens rather than cookies. A request from a non-allowed origin is rejected. Postman and Swagger never exposed this gap because they do not apply the browser same-origin policy.
- `GET /api/v1/auth/me` returns `CurrentUserResponse` so the frontend can route by role and restore a session after a page refresh without decoding the JWT client-side. `fullName` is `null` for `ADMIN` and `RECEPTIONIST` because those roles have no profile table in the MVP.
- `JwtAuthenticationFilter.shouldNotFilter` now skips only the four public auth paths instead of the whole `/api/v1/auth/` prefix. The previous prefix check would have left `SecurityContext` empty for `/api/v1/auth/me` and always returned `401`.
- `GlobalExceptionHandler` gained fallbacks for `MethodArgumentTypeMismatchException`, `MissingServletRequestParameterException`, `HttpMessageNotReadableException`, `HttpRequestMethodNotSupportedException`, `NoResourceFoundException`, and a catch-all `Exception`. Technical failures now use the same `ApiErrorResponse` shape as business errors, so the frontend needs only one error parser. The catch-all logs the stack trace but never returns internal details to the client.

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

### Doctor self-service profile

- `GET`/`PUT /api/v1/doctors/me` are implemented and require role `DOCTOR`. They mirror what `/api/v1/patients/me` gives a Patient, which previously had no equivalent for Doctors.
- The response includes `email` and `licenseNumber`, unlike the `DoctorResponse` directory view other roles see, because here the Doctor is reading their own data.
- `UpdateDoctorProfileRequest` carries only `fullName`, `phone` and `bio`. `specialty` and `licenseNumber` are deliberately absent: they are practising credentials and stay under `ADMIN` control, so a Doctor cannot change what they are licensed to practise. `email` belongs to the `User` account. Sending those fields anyway has no effect, since they are not bound.
- The `doctorId` is resolved from the JWT, never from a client parameter.
- Both matchers sit **above** the generic `GET /api/v1/doctors/**` rule in `SecurityConfig`; below it, `/api/v1/doctors/me` would have been reachable by every signed-in role. The literal `/me` path also takes precedence over `/{doctorId}` in Spring MVC, so `GET /api/v1/doctors/1` still resolves normally.
- Before this, a Doctor could not view their own weekly schedule without finding themselves in the public directory, and nobody could change a Doctor's phone or bio after creation, since no update endpoint existed at all.
- `DoctorProfileServiceTest` and `DoctorProfileControllerTest` pass (10 tests total).

### Receptionist patient lookup

- `GET /api/v1/receptionist/patients` is implemented and requires role `RECEPTIONIST`.
- Optional `name` and `phone` filters are supported with pagination; `name` is case-insensitive and both match on containment. Results are ordered by full name ascending.
- Only Patients whose User is `ACTIVE` are returned, because booking rejects an inactive account; returning them would let a Receptionist select someone the booking would then refuse.
- The response exposes only what is needed to identify the right person: patient id, full name, phone, date of birth and gender. Email and internal User fields are excluded.
- This endpoint was added because `POST /api/v1/receptionist/appointments` requires a `patientId` that a Receptionist previously had no way to look up, which made the booking endpoint unreachable from any user interface.
- It only finds Patients who already have an account. Creating a record for a walk-in patient is out of scope: `patients.user_id` is `NOT NULL`, so every Patient must be linked to a User.
- `ReceptionistPatientQueryServiceTest` and `ReceptionistPatientControllerTest` pass (8 tests total).

### Request parameter validation fix

`@Min` and `@Max` on request parameters in `@Validated` controllers throw `ConstraintViolationException`, which `GlobalExceptionHandler` did not handle. Every paginated endpoint therefore answered `500` to a client mistake such as `GET /api/v1/doctors?size=500` or `?page=-1`. The handler now returns `400 VALIDATION_ERROR` with the offending parameter in `fieldErrors`. The defect predates the frontend work and was found by a controller test for the new patient lookup.

### Admin staff management

- `POST /api/v1/admin/receptionists` creates an `ACTIVE` `RECEPTIONIST` User with a BCrypt-hashed temporary password.
- `GET /api/v1/admin/staff` lists only `DOCTOR` and `RECEPTIONIST` users with optional role/status filters and pagination.
- `POST /api/v1/admin/users/{userId}/activate` and `/deactivate` change staff status without deleting historical data.
- `AdminStaffServiceTest` and `AdminStaffControllerTest` cover creation, deactivation, and authorization.

## Frontend

The frontend foundation lives in `frontend/`. See `frontend/README.md` for the stack, structure and
the conventions that bridge backend behaviour and Ant Design.

- Vite 8, TypeScript 6, React 19, Ant Design 5, React Router 7, TanStack Query 5, Axios, Day.js.
- Ant Design is pinned to v5 deliberately: v6 renamed several props and reworked the DOM structure, while the available learning material still targets v5. React 19 requires `@ant-design/v5-patch-for-react-19`.
- `AuthContext` signs in through `POST /auth/login`, then calls `GET /auth/me` for the role, and repeats that identity call on every page load to restore the session. Tokens are kept in `localStorage`; the JWT is never decoded client-side.
- The Axios response interceptor retries a `401` once after refreshing. Concurrent `401`s share one in-flight refresh, because the backend rotates and revokes the previous refresh token, so parallel refreshes would make all but the first fail.
- `src/lib/` holds the conventions that would otherwise be repeated on every screen: one `ApiErrorResponse` parser, `fieldErrors` mapped onto Ant Design Form fields, the 0-based/1-based pagination conversion, and the `LocalDate`/`LocalTime` to Day.js conversions.
- Implemented so far: login, register, session restore across a reload, role-based navigation, logout, and the full Patient booking journey.
- Patient screens: doctor list with name/specialty filters and pagination, doctor detail with the weekly schedule, booking, own appointment list with status/date-range filters and sorting, and cancellation.
- The booking form renders the fixed 30-minute slots returned by the API as a `Radio.Group`, never a free-form time picker, so the UI cannot offer a time the backend would reject. The date picker also blocks weekdays the Doctor does not work, derived from the weekly schedule.
- A slot conflict (`APPOINTMENT_SLOT_ALREADY_BOOKED`, `APPOINTMENT_SLOT_NOT_AVAILABLE`, `PATIENT_TIME_CONFLICT`) clears the chosen slot and refetches the list, because that error means another patient took it first.
- Receptionist screens: clinic-wide appointment list with date, doctor and status filters, confirmation, cancellation without the 2-hour deadline, and booking on behalf of an existing patient through the new patient lookup. The patient list loads immediately and the inputs narrow it, because the API returns every patient when called without filters, so withholding the list in the UI would add friction without protecting anything.
- Doctor screens: own appointment list with date and status filters, an examination page that creates the Medical Record and then the Prescription, a patient history page, and a profile page. The profile page separates what the Doctor may edit from what an Admin controls, and shows the weekly schedule by calling the existing per-doctor schedule endpoint with the id returned by `/doctors/me`, rather than duplicating it. The examine button appears only on `CONFIRMED` appointments whose start time has passed, matching the service preconditions, and the prescription form uses `Form.List` so several medicines can be added to one prescription.
- Admin screens: staff management (create Doctor, create Receptionist, list with role and status filters, activate and deactivate) and weekly schedule management per Doctor (create, update, delete). Deactivation is presented as locking an account rather than deleting one, matching the backend, which changes status and keeps historical data.
- The schedule form validates that the end time is after the start time before submitting, which the backend enforces as well; the overlap and active-appointment rules can only be checked server-side, so those arrive as `409` and are shown as messages.
- Remaining Patient screens: medical history with sorting, prescriptions, and the profile form. The history screen fetches all prescriptions once and indexes them by medical record instead of issuing one request per record on screen, so it stays at two requests regardless of page size.
- Saving the profile calls `refreshUser()` on the auth context, so a renamed patient is reflected in the header immediately rather than after a reload.
- `PrescriptionTable` is shared between the doctor examination page, the patient history page and the patient prescription page; both read endpoints already include `medicineName`, so no extra lookup is needed to render one.
- The examination page finds its appointment inside the Doctor's own list, because the API has no single-appointment endpoint for a Doctor. That is adequate at the current data volume; a dedicated endpoint would be the right fix if the list outgrows one page.
- Each role has its own dashboard, built entirely from existing endpoints: counts come from `totalElements` on a `size=1` request rather than downloading rows to count them. The dashboards are meant to be acted on, not just read, so a Receptionist can confirm a pending appointment and a Doctor can start an examination without leaving the screen.
- The Admin dashboard shows staff figures only. The API gives `ADMIN` no view of appointments, since `/receptionist/appointments` and `/doctor/appointments` are restricted to those roles; in this MVP an Admin manages accounts and schedules rather than daily operations. The screen says so rather than leaving an unexplained gap.
- Menus only list routes that exist, so no navigation entry can reach a 404.
- The doctor list and doctor detail pages are open to every signed-in role, because `GET /api/v1/doctors` is, but the booking action is shown only to a `PATIENT`. Booking is a PATIENT-only endpoint, so other roles would have filled in the form and received a `403`; they now see the doctor's details and weekly schedule with a note instead, and a Receptionist is pointed at their own booking screen.
- Verified on 2026-09-05 against the running backend: `npm run build` passes (TypeScript plus Vite); the dev server serves on `http://localhost:5173`; a request from that origin to `GET /api/v1/auth/me` returns `200` with the CORS header; and the whole booking journey was exercised end to end — list, detail, schedules, slots, booking, duplicate booking rejected with `409 APPOINTMENT_SLOT_ALREADY_BOOKED`, filtered and sorted appointment list, cancellation, and the slot becoming available again afterwards.

## API Documentation

`docs/07-rest-api-design.md` now defines that successful endpoints return endpoint-specific response DTOs, except endpoints explicitly designed as `204 No Content`.

### Swagger UI

- `springdoc-openapi-starter-webmvc-ui` is configured for interactive API testing.
- Swagger UI is public at `http://localhost:8080/swagger-ui.html`; the generated OpenAPI document is at `/v3/api-docs`.
- The UI supports JWT Bearer authorization through its `Authorize` button.

## Verification

- `mvn test` passes with 149 tests, 0 failures (excluding `MedicalClinicApplicationTests`, which needs a live database).
- Run `mvn clean test` in a PowerShell session that has valid `DB_PASSWORD` and `JWT_SECRET` values before each milestone handoff.
- The frontend enablement changes were verified against a running application and MySQL on 2026-09-05: Flyway reached version 4; login with the seeded ADMIN, DOCTOR and PATIENT accounts succeeded; `GET /api/v1/auth/me` returned the correct identity for each role; the CORS preflight from `http://localhost:5173` was allowed while another origin was rejected; and the six error fallbacks all returned the `ApiErrorResponse` shape.

## Next Task

All four MVP roles now have a user interface, and the end-to-end demo flow of `docs/07-rest-api-design.md` section 29 runs entirely through the screens: register, log in, find a doctor, book, confirm, examine, prescribe, then read the record and the prescription as the patient. Nothing in the flow requires Postman any more.

Reasonable next steps, in no particular order:

- Frontend tests: 39 Vitest tests cover the token refresh interceptor, the pagination and error helpers, and role gating. The single-flight test was verified to fail when the guard is removed, so it is not vacuous. The screens themselves are uncovered.
- Code splitting: every page is lazily loaded, so a signed-in user downloads only the screens their role can reach. The entry chunk went from 1.47 MB to 432 kB and Vite's chunk size warning is gone.
- Screenshots in the README, so the interface is visible without cloning and running the project.
- The deferred backend items from `docs/07-rest-api-design.md` section 27, if the project scope is ever widened.
