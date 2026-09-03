package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.UpdatePatientProfileRequest;
import com.tranminh.medicalclinic.dto.response.PatientProfileResponse;
import com.tranminh.medicalclinic.service.PatientProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    public PatientProfileController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<PatientProfileResponse> getOwnProfile(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(patientProfileService.getOwnProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<PatientProfileResponse> updateOwnProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdatePatientProfileRequest request
    ) {
        return ResponseEntity.ok(patientProfileService.updateOwnProfile(userId, request));
    }
}
