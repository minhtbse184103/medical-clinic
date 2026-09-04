package com.tranminh.medicalclinic.dto.response;

public record PrescriptionMedicineResponse(
        Long medicineId,
        String medicineName,
        String dosage,
        String frequency,
        String duration,
        Integer quantity,
        String instruction
) {
}
