package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PatientPrescriptionPageResponse;
import com.tranminh.medicalclinic.service.PatientPrescriptionQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patients/me/prescriptions")
@Validated
public class PatientPrescriptionController {

    private final PatientPrescriptionQueryService service;

    public PatientPrescriptionController(PatientPrescriptionQueryService service) {
        this.service = service;
    }

    @GetMapping
    public PatientPrescriptionPageResponse getMyPrescriptions(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.getMyPrescriptions(userId, page, size);
    }
}
