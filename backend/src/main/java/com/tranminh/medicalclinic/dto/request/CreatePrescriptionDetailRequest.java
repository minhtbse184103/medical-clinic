package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreatePrescriptionDetailRequest(
        @NotNull @Positive Long medicineId,
        @NotBlank @Size(max = 100) String dosage,
        @NotBlank @Size(max = 100) String frequency,
        @NotBlank @Size(max = 100) String duration,
        @NotNull @Positive Integer quantity,
        @Size(max = 500) String instruction
) {
}
