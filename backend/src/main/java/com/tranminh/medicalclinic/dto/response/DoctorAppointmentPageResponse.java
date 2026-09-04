package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record DoctorAppointmentPageResponse(
        List<DoctorAppointmentResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
