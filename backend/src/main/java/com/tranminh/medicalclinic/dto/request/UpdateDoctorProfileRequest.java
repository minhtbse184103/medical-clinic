package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Only the fields a Doctor may maintain about themselves.
 *
 * Specialty and licence number are absent on purpose: those are practising credentials and
 * remain under ADMIN control. Email belongs to the User account and is not editable here.
 */
public record UpdateDoctorProfileRequest(
        @NotBlank
        @Size(max = 150)
        String fullName,

        @Size(max = 30)
        String phone,

        String bio
) {
}
