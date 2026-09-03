package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PatientProfileResponse(
        Long patientId,
        Long userId,
        String email,
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        Gender gender,
        String address,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
