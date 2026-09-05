Medical Clinic Management System — Codex Instructions

Goal

Build a strong Fresher/Junior Java Backend portfolio project: a Medical Clinic Management System. The implementation should demonstrate sound backend fundamentals and be easy to explain in CVs and technical interviews.

Working Style

Communicate with the developer primarily in Vietnamese.

Guide implementation step by step; do not generate the entire project at once.

Explain the design reason (why) before or alongside implementation (how).

Keep architecture appropriate for Fresher/Junior level; avoid overengineering.

Prefer that the developer writes the code first and Codex reviews/corrects it.

When reviewing code, identify the issue, explain why it matters, and suggest the smallest appropriate correction.

Before changing an established business rule, entity relationship, database constraint, or API contract, read the relevant /docs file and explain the reason for the proposed change.

Keep DTOs separate from JPA entities.

Bean Validation handles request/structural validation; the Service layer handles business rules.

Do not expose or commit secrets. The database password is supplied through the DB_PASSWORD environment variable.

Do not introduce Redis, Docker, i18n, distributed locks, or other later-stage features until the core MVP warrants them.

The core MVP backend is complete, so the frontend phase has started. React lives in `frontend/` and is no longer deferred; see `frontend/README.md` and the Frontend section of CURRENT_STATUS.md.

Do not refactor unrelated working code while implementing a focused task unless there is a clear reason and the developer is informed first.

Communication Language

Communicate and explain concepts primarily in Vietnamese.

Keep source code, class names, method names, variable names, package names, database identifiers, API paths, Git commit messages, and technical naming conventions in English.

Technical terms may remain in English when that is clearer than translating them.

Technology

Java 21

Spring Boot 4.1.1

Spring Web MVC

Spring Data JPA / Hibernate

Spring Security

MySQL 8.x

Flyway

JWT later

Redis later

Docker later

Swagger/OpenAPI later

JUnit / Mockito

React optional

Spring Boot 4 uses Jakarta packages.

Base Package

Use com.tranminh.medicalclinic consistently for main and test source packages.

Do not reintroduce com.tranminh.medical_clinic.

Project Structure

This repository is a monorepo. The Spring Boot project lives in `backend/`; the React application lives in `frontend/`, while shared design documents remain in the root `docs/` directory. Do not create empty packages merely to match the diagram; create them when they are actually needed.

backend/src/main/java/com/tranminh/medicalclinic/
├── config/
├── controller/
├── dto/
│   ├── request/
│   └── response/
├── entity/
├── enums/
├── exception/
├── repository/
├── security/
├── service/
└── MedicalClinicApplication.java

backend/src/main/resources/
├── db/
│   └── migration/
└── application.yml

backend/src/test/java/com/tranminh/medicalclinic/
└── ...

docs/
├── 01-project-scope.md
├── 02-actor-use-case-analysis.md
├── 03-business-rules-use-cases.md
├── 04-appointment-lifecycle.md
├── 05-domain-model-database-design.md
├── 06-physical-database-schema-erd.md
├── 07-rest-api-design.md
└── 08-ui-design-brief.md

Structure Rules

Inspect the existing project structure before creating a new package or architectural layer.

Reuse established conventions whenever possible.

Do not create new top-level packages without a clear reason.

Controllers handle HTTP concerns, request validation entry points, and response mapping; they should not contain business logic.

Business rules and use-case orchestration belong in service.

Database access belongs in repository.

JPA entities belong in entity.

Never expose JPA entities directly through REST APIs.

Request DTOs belong in dto/request.

Response DTOs belong in dto/response.

Application/domain enums belong in enums.

Business/global exceptions and exception handling belong in exception.

Spring Security and JWT-related code belongs in security when security implementation begins.

General Spring configuration belongs in config.

Flyway migrations belong in src/main/resources/db/migration.

Tests should mirror the main source package structure where practical.

Do not create service interfaces plus impl classes by default. Introduce an interface only when multiple implementations or another clear abstraction need exists.

Do not reorganize the project architecture without explaining the reason to the developer first.

Do not introduce Clean Architecture, Hexagonal Architecture, CQRS, event-driven architecture, facade layers, or similar abstractions unless a demonstrated project requirement justifies them.

MVP Roles

ADMIN

DOCTOR

RECEPTIONIST

PATIENT

There is no NURSE role in the MVP. Receptionist is represented by a User role and does not need a separate profile table.

Core Appointment Flow

Patient -> Find Doctor -> View Available Slots -> Book Appointment -> PENDING -> Receptionist confirms -> CONFIRMED -> Doctor examines -> Medical Record -> COMPLETED -> Prescription.

Appointment states:

PENDING

CONFIRMED

COMPLETED

CANCELLED

Allowed transitions:

PENDING -> CONFIRMED

PENDING -> CANCELLED

CONFIRMED -> COMPLETED

CONFIRMED -> CANCELLED

COMPLETED and CANCELLED are terminal states.

Patient cancellation is allowed for PENDING/CONFIRMED appointments at least 2 hours before the appointment. Receptionist can handle closer cancellations. Doctor completion occurs through medical-record creation.

Important Domain Decisions

Core entities: User, Patient, Doctor, DoctorSchedule, Appointment, MedicalRecord, Medicine, Prescription, PrescriptionDetail.

Use User plus profile tables; do not use JPA inheritance for Patient/Doctor.

One fixed role per User; Java enum persisted as VARCHAR.

DoctorSchedule represents weekly recurring schedules.

Generate 30-minute available slots dynamically; do not create an AppointmentSlot table initially.

Appointment stores date/time separately.

Keep cancelled appointments; do not hard-delete business history.

MedicalRecord is one-to-zero-or-one from Appointment and must have UNIQUE(appointment_id).

At most one Prescription per MedicalRecord.

PrescriptionDetail is an explicit entity.

Creating MedicalRecord and changing Appointment to COMPLETED must occur in one transaction.

Avoid CascadeType.ALL by default; choose cascade behavior deliberately.

Concurrency / Double Booking

Do not rely on a pre-SELECT alone to prevent double booking. The initial solution is:

Service transaction (@Transactional).

Database unique constraint as the final integrity guard.

Convert constraint violations into a suitable conflict response.

@Transactional alone does not serialize concurrent requests. Do not introduce synchronized, Redis locks, or distributed locks for the initial implementation.

For MySQL, the intended active-slot uniqueness strategy is based on a generated nullable flag:

active_flag TINYINT
GENERATED ALWAYS AS (
    CASE
        WHEN status IN ('PENDING', 'CONFIRMED') THEN 1
        ELSE NULL
    END
) STORED,
UNIQUE KEY uk_active_doctor_slot
    (doctor_id, appointment_date, start_time, active_flag)

Confirm this against docs/06-physical-database-schema-erd.md before finalizing the appointment migration/schema.

Persistence Strategy

Hibernate configuration uses ddl-auto: validate.

Hibernate validates entity mappings; it does not own schema evolution.

Flyway owns database schema and migrations.

Do not use ddl-auto: create, create-drop, or update as a shortcut for schema management.

Do not add an explicit Hibernate dialect merely to hide a failed database connection. Hibernate can detect MySQL from JDBC metadata when connectivity is correct.

Database constraints are part of business/data integrity and should not be replaced solely by application-side checks.

API Conventions

Base path: /api/v1.

Planned areas include authentication, admin staff management, patient profile, doctors, schedules/available slots, appointments, medical records, medicines, and prescriptions.

Follow docs/07-rest-api-design.md for the actual API contract.

General HTTP status conventions:

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

Pagination default: 20. Maximum: 100.

Project Documentation — Source of Truth

Before architectural, database, business-rule, or API work, read the relevant documents:

docs/01-project-scope.md — goals, scope, MVP boundaries.

docs/02-actor-use-case-analysis.md — actors, roles, permissions, use cases.

docs/03-business-rules-use-cases.md — detailed business rules.

docs/04-appointment-lifecycle.md — appointment state machine and cancellation rules.

docs/05-domain-model-database-design.md — entities and relationships.

docs/06-physical-database-schema-erd.md — physical schema, constraints, indexes, ERD.

docs/07-rest-api-design.md — REST endpoints, DTO direction, HTTP semantics.

Treat these documents as the project's design source of truth.

If documentation conflicts with a later explicit developer decision recorded in CURRENT_STATUS.md, flag the conflict rather than silently choosing one version.

Do not modify the documentation merely to make an implementation mismatch appear correct. Discuss the mismatch first.

Git / Repository Safety

Never commit real passwords, tokens, API keys, private keys, or other secrets.

Keep DB_PASSWORD as an environment variable; never place its real value in tracked configuration.

Before suggesting a commit, inspect the relevant changes and keep the commit focused on one logical step where practical.

Use clear English commit messages, for example feat: add initial database migration or fix: correct user email constraint.

Do not rewrite Git history, force-push, reset destructive changes, or delete developer work unless explicitly requested.

Current Workflow

Read CURRENT_STATUS.md before starting implementation work.

Continue from its Next Task; do not restart project setup unless necessary.

Before implementing a task:

Read CURRENT_STATUS.md.

Inspect the existing code/files involved in the task.

Read only the relevant /docs documents needed for the decision.

Explain the next small implementation step in Vietnamese.

Prefer letting the developer implement that step first.

Review the developer's implementation against the documentation and established rules.

Run or suggest the smallest relevant verification/test before moving on.

When a task is completed, recommend updating CURRENT_STATUS.md if the project state or next task materially changed.
