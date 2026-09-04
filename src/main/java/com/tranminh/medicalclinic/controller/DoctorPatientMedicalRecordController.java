package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorPatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.service.DoctorPatientMedicalRecordQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/patients")
@Validated
public class DoctorPatientMedicalRecordController {

    private final DoctorPatientMedicalRecordQueryService service;

    public DoctorPatientMedicalRecordController(DoctorPatientMedicalRecordQueryService service) {
        this.service = service;
    }

    @GetMapping("/{patientId}/medical-records")
    public DoctorPatientMedicalRecordPageResponse getPatientMedicalRecords(
            @AuthenticationPrincipal Long doctorUserId,
            @PathVariable @Positive Long patientId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.getPatientMedicalRecords(doctorUserId, patientId, page, size);
    }
}
