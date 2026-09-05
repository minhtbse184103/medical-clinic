package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;

import java.time.LocalDateTime;

/**
 * A staff account for the ADMIN console.
 *
 * The last three fields come from the Doctor profile and are null for a RECEPTIONIST, which
 * has no profile table in the MVP. Without them the console could only list email addresses:
 * the public doctor directory cannot be joined to this list, because it exposes neither the
 * user id nor the email, and it hides deactivated doctors entirely.
 */
public record StaffResponse(
        Long userId,
        String email,
        Role role,
        UserStatus status,
        LocalDateTime createdAt,
        String fullName,
        String specialty,
        String licenseNumber
) {
}
