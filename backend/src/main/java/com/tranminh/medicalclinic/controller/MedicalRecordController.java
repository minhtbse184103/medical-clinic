package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateMedicalRecordRequest;
import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.service.MedicalRecordService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/{appointmentId}/medical-record")
    public MedicalRecordResponse createMedicalRecord(
            @AuthenticationPrincipal Long userId,
            @PathVariable @Positive Long appointmentId,
            @Valid @RequestBody CreateMedicalRecordRequest request
    ) {
        return medicalRecordService.createMedicalRecord(userId, appointmentId, request);
    }
}
