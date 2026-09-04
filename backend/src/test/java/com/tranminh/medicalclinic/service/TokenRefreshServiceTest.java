package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.RefreshTokenRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.entity.RefreshToken;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.InvalidRefreshTokenException;
import com.tranminh.medicalclinic.repository.UserRepository;
import com.tranminh.medicalclinic.repository.RefreshTokenRepository;
import com.tranminh.medicalclinic.security.JwtProperties;
import com.tranminh.medicalclinic.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenRefreshServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private RefreshToken storedRefreshToken;

    @Mock
    private User user;

    private TokenRefreshService tokenRefreshService;

    @BeforeEach
    void setUp() {
        tokenRefreshService = new TokenRefreshService(
                userRepository,
                jwtService,
                new JwtProperties("test-secret", 900, 604800),
                refreshTokenRepository
        );
    }

    @Test
    void refresh_returnsNewTokenPairForActiveUser() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
        when(jwtService.isRefreshToken(request.refreshToken())).thenReturn(true);
        when(jwtService.extractUserId(request.refreshToken())).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(jwtService.extractTokenId(request.refreshToken())).thenReturn("old-token-id");
        when(refreshTokenRepository.findByTokenIdAndUser_Id("old-token-id", 1L)).thenReturn(Optional.of(storedRefreshToken));
        when(jwtService.generateAccessToken(user)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new-refresh-token");
        when(jwtService.extractTokenId("new-refresh-token")).thenReturn("new-token-id");
        when(jwtService.extractExpiration("new-refresh-token")).thenReturn(Instant.parse("2026-09-11T09:00:00Z"));

        LoginResponse response = tokenRefreshService.refresh(request);

        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());
        assertEquals(900, response.expiresIn());
        verify(userRepository).findById(1L);
        verify(refreshTokenRepository).deleteByTokenId("old-token-id");
        verify(refreshTokenRepository).save(org.mockito.ArgumentMatchers.any(RefreshToken.class));
    }

    @Test
    void refresh_throwsExceptionWhenTokenTypeIsNotRefresh() {
        RefreshTokenRequest request = new RefreshTokenRequest("access-token");
        when(jwtService.isRefreshToken(request.refreshToken())).thenReturn(false);

        assertThrows(InvalidRefreshTokenException.class, () -> tokenRefreshService.refresh(request));
    }

    @Test
    void refresh_throwsExceptionWhenAccountIsInactive() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
        when(jwtService.isRefreshToken(request.refreshToken())).thenReturn(true);
        when(jwtService.extractUserId(request.refreshToken())).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.INACTIVE);

        assertThrows(AccountInactiveException.class, () -> tokenRefreshService.refresh(request));
    }

    @Test
    void logout_deletesStoredRefreshToken() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
        when(jwtService.isRefreshToken(request.refreshToken())).thenReturn(true);
        when(jwtService.extractTokenId(request.refreshToken())).thenReturn("token-id");

        tokenRefreshService.logout(request);

        verify(refreshTokenRepository).deleteByTokenId("token-id");
    }
}
