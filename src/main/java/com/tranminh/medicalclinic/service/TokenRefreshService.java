package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.RefreshTokenRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.entity.RefreshToken;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.InvalidRefreshTokenException;
import com.tranminh.medicalclinic.repository.UserRepository;
import com.tranminh.medicalclinic.repository.RefreshTokenRepository;
import com.tranminh.medicalclinic.security.JwtProperties;
import com.tranminh.medicalclinic.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class TokenRefreshService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;

    public TokenRefreshService(
            UserRepository userRepository,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenRepository refreshTokenRepository
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
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

            String tokenId = jwtService.extractTokenId(refreshToken);
            refreshTokenRepository.findByTokenIdAndUser_Id(tokenId, userId)
                    .orElseThrow(InvalidRefreshTokenException::new);

            refreshTokenRepository.deleteByTokenId(tokenId);
            return issueTokenPair(user);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new InvalidRefreshTokenException();
        }
    }

    @Transactional
    public LoginResponse issueTokenPair(User user) {
        String refreshToken = jwtService.generateRefreshToken(user);
        refreshTokenRepository.save(new RefreshToken(
                user,
                jwtService.extractTokenId(refreshToken),
                LocalDateTime.ofInstant(jwtService.extractExpiration(refreshToken), ZoneOffset.UTC)
        ));

        return new LoginResponse(
                jwtService.generateAccessToken(user),
                refreshToken,
                "Bearer",
                jwtProperties.accessTokenExpirationSeconds()
        );
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        try {
            String refreshToken = request.refreshToken();
            if (jwtService.isRefreshToken(refreshToken)) {
                refreshTokenRepository.deleteByTokenId(jwtService.extractTokenId(refreshToken));
            }
        } catch (JwtException | IllegalArgumentException ignored) {
            // Logout is idempotent: an expired or already revoked refresh token is treated as logged out.
        }
    }
}
