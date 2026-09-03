package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.RefreshTokenRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.InvalidRefreshTokenException;
import com.tranminh.medicalclinic.repository.UserRepository;
import com.tranminh.medicalclinic.security.JwtProperties;
import com.tranminh.medicalclinic.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Service;

@Service
public class TokenRefreshService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public TokenRefreshService(
            UserRepository userRepository,
            JwtService jwtService,
            JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        try {
            String refreshToken = request.refreshToken();
            if (!jwtService.isRefreshToken(refreshToken)) {
                throw new InvalidRefreshTokenException();
            }

            long userId = jwtService.extractUserId(refreshToken);
            User user = userRepository.findById(userId)
                    .orElseThrow(InvalidRefreshTokenException::new);

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new AccountInactiveException();
            }

            return new LoginResponse(
                    jwtService.generateAccessToken(user),
                    jwtService.generateRefreshToken(user),
                    "Bearer",
                    jwtProperties.accessTokenExpirationSeconds()
            );
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidRefreshTokenException();
        }
    }
}
