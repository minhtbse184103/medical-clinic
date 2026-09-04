package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record DoctorPageResponse(
        List<DoctorResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
