package com.tranminh.medicalclinic.exception;

import com.tranminh.medicalclinic.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailAlreadyExists(
            EmailAlreadyExistsException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "EMAIL_ALREADY_EXISTS",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(PatientProfileNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handlePatientProfileNotFound(
            PatientProfileNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "PATIENT_PROFILE_NOT_FOUND",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(AccountInactiveException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountInactive(
            AccountInactiveException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "ACCOUNT_INACTIVE",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRefreshToken(
            InvalidRefreshTokenException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                "INVALID_REFRESH_TOKEN",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorLicenseNumberAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorLicenseNumberAlreadyExists(
            DoctorLicenseNumberAlreadyExistsException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "DOCTOR_LICENSE_NUMBER_ALREADY_EXISTS",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorNotFound(
            DoctorNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "DOCTOR_NOT_FOUND",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorProfileNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorProfileNotFound(
            DoctorProfileNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "DOCTOR_PROFILE_NOT_FOUND",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorScheduleInvalidTimeRangeException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorScheduleInvalidTimeRange(
            DoctorScheduleInvalidTimeRangeException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "DOCTOR_SCHEDULE_INVALID_TIME_RANGE",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorScheduleOverlapException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorScheduleOverlap(
            DoctorScheduleOverlapException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "DOCTOR_SCHEDULE_OVERLAP",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorScheduleNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorScheduleNotFound(
            DoctorScheduleNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.NOT_FOUND,
                "DOCTOR_SCHEDULE_NOT_FOUND",
                exception.getMessage(),
                request.getRequestURI(),
                null
        );
    }

    @ExceptionHandler(DoctorNotAvailableException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorNotAvailable(
            DoctorNotAvailableException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, "DOCTOR_NOT_AVAILABLE", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentTimePassedException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentTimePassed(
            AppointmentTimePassedException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, "APPOINTMENT_TIME_PASSED", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentSlotNotAvailableException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentSlotNotAvailable(
            AppointmentSlotNotAvailableException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, "APPOINTMENT_SLOT_NOT_AVAILABLE", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentSlotAlreadyBookedException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentSlotAlreadyBooked(
            AppointmentSlotAlreadyBookedException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, "APPOINTMENT_SLOT_ALREADY_BOOKED", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(PatientTimeConflictException.class)
    public ResponseEntity<ApiErrorResponse> handlePatientTimeConflict(
            PatientTimeConflictException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.CONFLICT, "PATIENT_TIME_CONFLICT", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(InvalidAppointmentDateRangeException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAppointmentDateRange(
            InvalidAppointmentDateRangeException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, "INVALID_APPOINTMENT_DATE_RANGE", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentNotFound(AppointmentNotFoundException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "APPOINTMENT_NOT_FOUND", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(InvalidAppointmentStatusTransitionException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAppointmentStatusTransition(InvalidAppointmentStatusTransitionException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, "INVALID_APPOINTMENT_STATUS_TRANSITION", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentOwnershipException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentOwnership(AppointmentOwnershipException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "APPOINTMENT_OWNERSHIP_FORBIDDEN", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(DoctorAppointmentAccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleDoctorAppointmentAccess(DoctorAppointmentAccessDeniedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "DOCTOR_APPOINTMENT_ACCESS_FORBIDDEN", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(MedicalRecordAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleMedicalRecordAlreadyExists(MedicalRecordAlreadyExistsException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, "MEDICAL_RECORD_ALREADY_EXISTS", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentTimeNotReachedException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentTimeNotReached(AppointmentTimeNotReachedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "APPOINTMENT_TIME_NOT_REACHED", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AppointmentCancellationDeadlinePassedException.class)
    public ResponseEntity<ApiErrorResponse> handleAppointmentCancellationDeadline(AppointmentCancellationDeadlinePassedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, "APPOINTMENT_CANCELLATION_DEADLINE_PASSED", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(InvalidAppointmentSortException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAppointmentSort(
            InvalidAppointmentSortException exception,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, "INVALID_APPOINTMENT_SORT", exception.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Dữ liệu không hợp lệ.",
                request.getRequestURI(),
                fieldErrors
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String code,
            String message,
            String path,
            Map<String, String> fieldErrors
    ) {
        ApiErrorResponse response = new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                path,
                fieldErrors
        );
        return ResponseEntity.status(status).body(response);
    }
}
