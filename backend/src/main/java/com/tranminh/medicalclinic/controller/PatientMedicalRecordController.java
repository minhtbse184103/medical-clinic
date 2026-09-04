package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.service.PatientMedicalRecordQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patients/me/medical-records")
@Validated
public class PatientMedicalRecordController {
    private final PatientMedicalRecordQueryService service;
    public PatientMedicalRecordController(PatientMedicalRecordQueryService service) { this.service = service; }
    @GetMapping
    public PatientMedicalRecordPageResponse getMyRecords(@AuthenticationPrincipal Long userId, @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size, @RequestParam(defaultValue = "createdAt,desc") String sort) { return service.getMyRecords(userId, page, size, sort); }
}
