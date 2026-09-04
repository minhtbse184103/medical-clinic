package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.ReceptionistAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.service.ReceptionistAppointmentQueryService;
import com.tranminh.medicalclinic.service.ReceptionistAppointmentCancellationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
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
@RequestMapping("/api/v1/receptionist/appointments")
@Validated
public class ReceptionistAppointmentController {

    private final ReceptionistAppointmentQueryService receptionistAppointmentQueryService;
    private final ReceptionistAppointmentCancellationService receptionistAppointmentCancellationService;

    public ReceptionistAppointmentController(
            ReceptionistAppointmentQueryService receptionistAppointmentQueryService,
            ReceptionistAppointmentCancellationService receptionistAppointmentCancellationService
    ) {
        this.receptionistAppointmentQueryService = receptionistAppointmentQueryService;
        this.receptionistAppointmentCancellationService = receptionistAppointmentCancellationService;
    }

    @GetMapping
    public ReceptionistAppointmentPageResponse getAppointments(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) @Positive Long doctorId,
            @RequestParam(required = false) @Positive Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return receptionistAppointmentQueryService.getAppointments(date, doctorId, patientId, status, page, size);
    }

    @PostMapping("/{appointmentId}/cancel")
    public org.springframework.http.ResponseEntity<Void> cancelAppointment(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Long userId,
            @PathVariable @Positive Long appointmentId,
            @Valid @RequestBody CancelAppointmentRequest request
    ) {
        receptionistAppointmentCancellationService.cancel(userId, appointmentId, request);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}
