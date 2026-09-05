package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;

/**
 * Identity of the authenticated user, used by the frontend to restore a session and route by role.
 * fullName is null for ADMIN and RECEPTIONIST because those roles have no profile table in the MVP.
 */
public record CurrentUserResponse(
        Long userId,
        String email,
        Role role,
        UserStatus status,
        String fullName
) {
}
