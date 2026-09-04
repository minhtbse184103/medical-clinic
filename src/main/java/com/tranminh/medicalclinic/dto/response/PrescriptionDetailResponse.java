package com.tranminh.medicalclinic.dto.response;

public record PrescriptionDetailResponse(
        Long medicineId,
        String dosage,
        String frequency,
        String duration,
        Integer quantity,
        String instruction
) {
}
