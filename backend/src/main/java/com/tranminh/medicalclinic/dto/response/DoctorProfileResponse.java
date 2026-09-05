package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.UserStatus;

import java.time.LocalDateTime;

/**
 * A Doctor's own profile. Unlike {@link DoctorResponse}, which is the directory view other
 * roles see, this includes the email and licence number, because they belong to the Doctor
 * reading them.
 */
public record DoctorProfileResponse(
        Long doctorId,
        Long userId,
        String email,
        String fullName,
        String phone,
        String specialty,
        String licenseNumber,
        String bio,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
