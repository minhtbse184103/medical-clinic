package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.UpdateDoctorProfileRequest;
import com.tranminh.medicalclinic.dto.response.DoctorProfileResponse;
import com.tranminh.medicalclinic.service.DoctorProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A Doctor's own profile, mirroring what /api/v1/patients/me gives a Patient.
 *
 * The literal /me path takes precedence over /{doctorId} in DoctorController, so the two
 * mappings under /api/v1/doctors do not conflict.
 */
@RestController
@RequestMapping("/api/v1/doctors/me")
public class DoctorProfileController {

    private final DoctorProfileService doctorProfileService;

    public DoctorProfileController(DoctorProfileService doctorProfileService) {
        this.doctorProfileService = doctorProfileService;
    }

    @GetMapping
    public DoctorProfileResponse getOwnProfile(@AuthenticationPrincipal Long userId) {
        return doctorProfileService.getOwnProfile(userId);
    }

    @PutMapping
    public DoctorProfileResponse updateOwnProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateDoctorProfileRequest request
    ) {
        return doctorProfileService.updateOwnProfile(userId, request);
    }
}
