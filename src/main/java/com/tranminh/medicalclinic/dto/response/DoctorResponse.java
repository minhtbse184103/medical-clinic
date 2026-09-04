package com.tranminh.medicalclinic.dto.response;

public record DoctorResponse(
        Long doctorId,
        String fullName,
        String phone,
        String specialty,
        String bio
) {
}
