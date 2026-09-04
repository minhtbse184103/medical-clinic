package com.tranminh.medicalclinic.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionViewResponse(
        Long prescriptionId,
        Long medicalRecordId,
        Long appointmentId,
        String notes,
        List<PrescriptionMedicineResponse> details,
        LocalDateTime createdAt
) {
}
