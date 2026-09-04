package com.tranminh.medicalclinic.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionResponse(
        Long prescriptionId,
        Long medicalRecordId,
        String notes,
        List<PrescriptionDetailResponse> details,
        LocalDateTime createdAt
) {
}
