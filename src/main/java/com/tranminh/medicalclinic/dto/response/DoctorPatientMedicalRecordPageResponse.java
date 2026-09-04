package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record DoctorPatientMedicalRecordPageResponse(
        Long patientId,
        List<MedicalRecordResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
