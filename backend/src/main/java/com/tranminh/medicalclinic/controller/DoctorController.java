package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorResponse;
import com.tranminh.medicalclinic.service.DoctorQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctors")
@Validated
public class DoctorController {

    private final DoctorQueryService doctorQueryService;

    public DoctorController(DoctorQueryService doctorQueryService) {
        this.doctorQueryService = doctorQueryService;
    }

    @GetMapping
    public DoctorPageResponse getDoctors(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String name
    ) {
        return doctorQueryService.getDoctors(page, size, specialty, name);
    }

    @GetMapping("/{doctorId}")
    public DoctorResponse getDoctor(@PathVariable @Positive Long doctorId) {
        return doctorQueryService.getDoctor(doctorId);
    }
}
