package com.tranminh.medicalclinic.dto.response;

import java.time.LocalDateTime;

public record MedicalRecordResponse(
        Long medicalRecordId,
        Long appointmentId,
        String symptoms,
        String diagnosis,
        String treatment,
        String notes,
        LocalDateTime createdAt
) {
}
