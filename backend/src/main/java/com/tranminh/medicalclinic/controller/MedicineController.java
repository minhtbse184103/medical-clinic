package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.MedicinePageResponse;
import com.tranminh.medicalclinic.service.MedicineQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/medicines")
@Validated
public class MedicineController {

    private final MedicineQueryService service;

    public MedicineController(MedicineQueryService service) {
        this.service = service;
    }

    @GetMapping
    public MedicinePageResponse getMedicines(
            @AuthenticationPrincipal Long doctorUserId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.getMedicines(doctorUserId, name, active, page, size);
    }
}
