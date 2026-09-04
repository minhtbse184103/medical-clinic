package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelAppointmentRequest(
        @NotBlank @Size(max = 500) String reason
) {
}
