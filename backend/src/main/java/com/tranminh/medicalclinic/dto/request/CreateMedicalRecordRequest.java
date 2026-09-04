package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMedicalRecordRequest(
        @Size(max = 5000) String symptoms,
        @NotBlank @Size(max = 5000) String diagnosis,
        @Size(max = 5000) String treatment,
        @Size(max = 5000) String notes
) {
}
