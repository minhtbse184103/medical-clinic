package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreatePrescriptionRequest;
import com.tranminh.medicalclinic.dto.response.PrescriptionResponse;
import com.tranminh.medicalclinic.service.PrescriptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/medical-records")
public class PrescriptionController {
    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping("/{medicalRecordId}/prescription")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @AuthenticationPrincipal Long userId,
            @PathVariable @Positive Long medicalRecordId,
            @Valid @RequestBody CreatePrescriptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prescriptionService.createPrescription(userId, medicalRecordId, request));
    }
}
