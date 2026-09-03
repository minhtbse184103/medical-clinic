package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateDoctorRequest;
import com.tranminh.medicalclinic.dto.response.CreateDoctorResponse;
import com.tranminh.medicalclinic.service.AdminDoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/doctors")
public class AdminDoctorController {

    private final AdminDoctorService adminDoctorService;

    public AdminDoctorController(AdminDoctorService adminDoctorService) {
        this.adminDoctorService = adminDoctorService;
    }

    @PostMapping
    public ResponseEntity<CreateDoctorResponse> createDoctor(
            @Valid @RequestBody CreateDoctorRequest request
    ) {
        CreateDoctorResponse response = adminDoctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
