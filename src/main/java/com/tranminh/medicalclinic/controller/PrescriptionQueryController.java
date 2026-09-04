package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PrescriptionViewResponse;
import com.tranminh.medicalclinic.service.PrescriptionQueryService;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/medical-records")
@Validated
public class PrescriptionQueryController {

    private final PrescriptionQueryService service;

    public PrescriptionQueryController(PrescriptionQueryService service) {
        this.service = service;
    }

    @GetMapping("/{medicalRecordId}/prescription")
    public PrescriptionViewResponse getPrescription(
            @AuthenticationPrincipal Long userId,
            Authentication authentication,
            @PathVariable @Positive Long medicalRecordId
    ) {
        boolean isDoctor = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_DOCTOR"));
        return service.getPrescription(userId, isDoctor, medicalRecordId);
    }
}
