package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePrescriptionRequest(
        @Size(max = 1000) String notes,
        @NotEmpty List<@Valid CreatePrescriptionDetailRequest> items
) {
}
