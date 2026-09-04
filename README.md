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
