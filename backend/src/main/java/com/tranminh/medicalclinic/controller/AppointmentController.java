package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateAppointmentRequest;
import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.dto.response.ConfirmAppointmentResponse;
import com.tranminh.medicalclinic.dto.response.PatientAppointmentPageResponse;
import com.tranminh.medicalclinic.service.AppointmentBookingService;
import com.tranminh.medicalclinic.service.PatientAppointmentQueryService;
import com.tranminh.medicalclinic.service.AppointmentConfirmationService;
import com.tranminh.medicalclinic.service.PatientAppointmentCancellationService;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/appointments")
@Validated
public class AppointmentController {

    private final AppointmentBookingService appointmentBookingService;
    private final PatientAppointmentQueryService patientAppointmentQueryService;
    private final AppointmentConfirmationService appointmentConfirmationService;
    private final PatientAppointmentCancellationService patientAppointmentCancellationService;

    public AppointmentController(
            AppointmentBookingService appointmentBookingService,
            PatientAppointmentQueryService patientAppointmentQueryService,
            AppointmentConfirmationService appointmentConfirmationService,
            PatientAppointmentCancellationService patientAppointmentCancellationService
    ) {
        this.appointmentBookingService = appointmentBookingService;
        this.patientAppointmentQueryService = patientAppointmentQueryService;
        this.appointmentConfirmationService = appointmentConfirmationService;
        this.patientAppointmentCancellationService = patientAppointmentCancellationService;
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateAppointmentRequest request
    ) {
        AppointmentResponse response = appointmentBookingService.bookAppointment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public PatientAppointmentPageResponse getMyAppointments(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "appointmentDate,desc") String sort
    ) {
        return patientAppointmentQueryService.getMyAppointments(
                userId, status, fromDate, toDate, page, size, sort
        );
    }

    @PostMapping("/{appointmentId}/confirm")
    public ConfirmAppointmentResponse confirmAppointment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long appointmentId
    ) {
        return appointmentConfirmationService.confirm(userId, appointmentId);
    }

    @PostMapping("/{appointmentId}/cancel")
    public ResponseEntity<Void> cancelAppointment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long appointmentId,
            @Valid @RequestBody CancelAppointmentRequest request
    ) {
        patientAppointmentCancellationService.cancel(userId, appointmentId, request);
        return ResponseEntity.ok().build();
    }
}
