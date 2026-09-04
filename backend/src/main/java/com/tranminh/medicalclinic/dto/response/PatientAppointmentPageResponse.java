package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record PatientAppointmentPageResponse(
        List<PatientAppointmentResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
