package com.tranminh.medicalclinic.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record PatientPrescriptionResponse(
        Long prescriptionId,
        Long medicalRecordId,
        Long appointmentId,
        String notes,
        List<PatientPrescriptionDetailResponse> details,
        LocalDateTime createdAt
) {
}
