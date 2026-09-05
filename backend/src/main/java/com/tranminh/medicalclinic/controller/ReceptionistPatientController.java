package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.ReceptionistPatientPageResponse;
import com.tranminh.medicalclinic.service.ReceptionistPatientQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lets a Receptionist find an existing Patient before booking on their behalf.
 * Without this, POST /api/v1/receptionist/appointments could not be used from a UI,
 * because it needs a patientId that the Receptionist had no way to look up.
 */
@RestController
@RequestMapping("/api/v1/receptionist/patients")
@Validated
public class ReceptionistPatientController {

    private final ReceptionistPatientQueryService receptionistPatientQueryService;

    public ReceptionistPatientController(
            ReceptionistPatientQueryService receptionistPatientQueryService
    ) {
        this.receptionistPatientQueryService = receptionistPatientQueryService;
    }

    @GetMapping
    public ReceptionistPatientPageResponse searchPatients(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone
    ) {
        return receptionistPatientQueryService.searchPatients(page, size, name, phone);
    }
}
