package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateReceptionistRequest;
import com.tranminh.medicalclinic.dto.response.StaffPageResponse;
import com.tranminh.medicalclinic.dto.response.StaffResponse;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.service.AdminStaffService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@Validated
public class AdminStaffController {

    private final AdminStaffService service;

    public AdminStaffController(AdminStaffService service) {
        this.service = service;
    }

    @PostMapping("/receptionists")
    public ResponseEntity<StaffResponse> createReceptionist(@Valid @RequestBody CreateReceptionistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createReceptionist(request));
    }

    @GetMapping("/staff")
    public StaffPageResponse getStaff(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.getStaff(role, status, page, size);
    }

    @PostMapping("/users/{userId}/activate")
    public StaffResponse activate(@PathVariable @Positive Long userId) {
        return service.activate(userId);
    }

    @PostMapping("/users/{userId}/deactivate")
    public StaffResponse deactivate(@PathVariable @Positive Long userId) {
        return service.deactivate(userId);
    }
}
