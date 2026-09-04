package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record StaffPageResponse(
        List<StaffResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
