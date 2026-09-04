package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record PatientPrescriptionPageResponse(
        List<PatientPrescriptionResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
