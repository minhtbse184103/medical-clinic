package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDoctorRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Size(min = 8, max = 255)
        String temporaryPassword,

        @NotBlank
        @Size(max = 150)
        String fullName,

        @Size(max = 30)
        String phone,

        @NotBlank
        @Size(max = 120)
        String specialty,

        @NotBlank
        @Size(max = 100)
        String licenseNumber,

        String bio
) {
}
