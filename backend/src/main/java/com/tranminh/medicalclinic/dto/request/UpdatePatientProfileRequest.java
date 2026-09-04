package com.tranminh.medicalclinic.dto.request;

import com.tranminh.medicalclinic.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdatePatientProfileRequest(
        @NotBlank
        @Size(max = 150)
        String fullName,

        @Size(max = 30)
        String phone,

        @PastOrPresent
        LocalDate dateOfBirth,

        Gender gender,

        @Size(max = 500)
        String address
) {
}
