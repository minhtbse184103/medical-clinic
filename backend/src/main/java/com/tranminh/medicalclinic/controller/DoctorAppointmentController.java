package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorAppointmentPageResponse;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.service.DoctorAppointmentQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/doctor/appointments")
@Validated
public class DoctorAppointmentController {

    private final DoctorAppointmentQueryService doctorAppointmentQueryService;

    public DoctorAppointmentController(DoctorAppointmentQueryService doctorAppointmentQueryService) {
        this.doctorAppointmentQueryService = doctorAppointmentQueryService;
    }

    @GetMapping
    public DoctorAppointmentPageResponse getMyAppointments(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return doctorAppointmentQueryService.getMyAppointments(userId, date, status, page, size);
    }
}
