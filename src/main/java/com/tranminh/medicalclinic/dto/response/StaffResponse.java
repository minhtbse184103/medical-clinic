package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;

import java.time.LocalDateTime;

public record StaffResponse(
        Long userId,
        String email,
        Role role,
        UserStatus status,
        LocalDateTime createdAt
) {
}
