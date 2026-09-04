package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record MedicinePageResponse(
        List<MedicineCatalogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
