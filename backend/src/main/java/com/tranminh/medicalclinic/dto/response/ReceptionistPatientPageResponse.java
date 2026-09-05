package com.tranminh.medicalclinic.dto.response;

import java.util.List;

public record ReceptionistPatientPageResponse(
        List<ReceptionistPatientResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
