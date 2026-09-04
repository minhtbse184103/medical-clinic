package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.UserStatus;

import java.time.LocalDateTime;

public record CreateDoctorResponse(
        Long userId,
        Long doctorId,
        String email,
        String fullName,
        String phone,
        String specialty,
        String licenseNumber,
        String bio,
        UserStatus status,
        LocalDateTime createdAt
) {
}
