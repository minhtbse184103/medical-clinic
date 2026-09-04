package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record ReceptionistAppointmentPageResponse(
        List<ReceptionistAppointmentResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
