package com.tranminh.medicalclinic.dto.response;

public record MedicineCatalogResponse(
        Long medicineId,
        String name,
        String unit,
        String description,
        boolean active
) {
}
