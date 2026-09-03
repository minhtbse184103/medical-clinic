package com.tranminh.medicalclinic.dto.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
) {
}
