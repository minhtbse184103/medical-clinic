package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.LoginRequest;
import com.tranminh.medicalclinic.dto.request.RefreshTokenRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.dto.request.RegisterPatientRequest;
import com.tranminh.medicalclinic.dto.response.RegisterPatientResponse;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.exception.InvalidCredentialsException;
import com.tranminh.medicalclinic.exception.InvalidRefreshTokenException;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.service.LoginService;
import com.tranminh.medicalclinic.service.RegistrationService;
import com.tranminh.medicalclinic.service.TokenRefreshService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RegistrationService registrationService;

    @MockitoBean
    private LoginService loginService;

    @MockitoBean
    private TokenRefreshService tokenRefreshService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RestAuthenticationEntryPoint authenticationEntryPoint;

    @MockitoBean
    private RestAccessDeniedHandler accessDeniedHandler;

    @Test
    void registerPatient_returnsCreatedResponseForPublicEndpoint() throws Exception {
        when(registrationService.registerPatient(any(RegisterPatientRequest.class)))
                .thenReturn(new RegisterPatientResponse(
                        1L,
                        1L,
                        "patient@example.com",
                        "Nguyen Van A",
                        "0901234567",
                        LocalDate.of(2000, 5, 10),
                        Gender.MALE,
                        "Ho Chi Minh City",
                        UserStatus.ACTIVE,
                        LocalDateTime.of(2026, 9, 3, 12, 30)
                ));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("patient@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void registerPatient_returnsBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "invalid-email",
                                  "password": "short",
                                  "fullName": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists());
    }

    @Test
    void registerPatient_returnsConflictWhenEmailAlreadyExists() throws Exception {
        when(registrationService.registerPatient(any(RegisterPatientRequest.class)))
                .thenThrow(new EmailAlreadyExistsException("patient@example.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void login_returnsOkResponseForPublicEndpoint() throws Exception {
        when(loginService.login(any(LoginRequest.class)))
                .thenReturn(new LoginResponse("access-token", "refresh-token", "Bearer", 900));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validLoginRequestJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void login_returnsUnauthorizedForInvalidCredentials() throws Exception {
        when(loginService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validLoginRequestJson()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void refresh_returnsOkResponseForPublicEndpoint() throws Exception {
        when(tokenRefreshService.refresh(any(RefreshTokenRequest.class)))
                .thenReturn(new LoginResponse("new-access-token", "new-refresh-token", "Bearer", 900));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"refreshToken\": \"refresh-token\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token"));
    }

    @Test
    void refresh_returnsUnauthorizedForInvalidRefreshToken() throws Exception {
        when(tokenRefreshService.refresh(any(RefreshTokenRequest.class)))
                .thenThrow(new InvalidRefreshTokenException());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"refreshToken\": \"refresh-token\" }"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
    }

    private String validRequestJson() {
        return """
                {
                  "email": "patient@example.com",
                  "password": "Password123!",
                  "fullName": "Nguyen Van A",
                  "phone": "0901234567",
                  "dateOfBirth": "2000-05-10",
                  "gender": "MALE",
                  "address": "Ho Chi Minh City"
                }
                """;
    }

    private String validLoginRequestJson() {
        return """
                {
                  "email": "patient@example.com",
                  "password": "Password123!"
                }
                """;
    }
}
