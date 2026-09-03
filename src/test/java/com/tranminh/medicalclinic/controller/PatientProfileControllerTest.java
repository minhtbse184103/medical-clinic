package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.UpdatePatientProfileRequest;
import com.tranminh.medicalclinic.dto.response.PatientProfileResponse;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.PatientProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientProfileController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class PatientProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientProfileService patientProfileService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RestAuthenticationEntryPoint authenticationEntryPoint;

    @MockitoBean
    private RestAccessDeniedHandler accessDeniedHandler;

    @Test
    void getOwnProfile_returnsProfileForAuthenticatedPatient() throws Exception {
        when(patientProfileService.getOwnProfile(1L)).thenReturn(profileResponse());

        mockMvc.perform(get("/api/v1/patients/me")
                        .with(authentication(patientAuthentication(1L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(10))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("patient@example.com"));

        verify(patientProfileService).getOwnProfile(1L);
    }

    @Test
    void updateOwnProfile_returnsUpdatedProfileForAuthenticatedPatient() throws Exception {
        when(patientProfileService.updateOwnProfile(eq(1L), any(UpdatePatientProfileRequest.class)))
                .thenReturn(profileResponse());

        mockMvc.perform(put("/api/v1/patients/me")
                        .with(authentication(patientAuthentication(1L)))
                        .contentType("application/json")
                        .content(validUpdateRequestJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(10))
                .andExpect(jsonPath("$.fullName").value("Nguyen Van A"));

        verify(patientProfileService).updateOwnProfile(eq(1L), any(UpdatePatientProfileRequest.class));
    }

    @Test
    void updateOwnProfile_returnsBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(put("/api/v1/patients/me")
                        .with(authentication(patientAuthentication(1L)))
                        .contentType("application/json")
                        .content("{ \"fullName\": \"\", \"dateOfBirth\": \"2999-01-01\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.dateOfBirth").exists());
    }

    private UsernamePasswordAuthenticationToken patientAuthentication(Long userId) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))
        );
    }

    private PatientProfileResponse profileResponse() {
        return new PatientProfileResponse(
                10L,
                1L,
                "patient@example.com",
                "Nguyen Van A",
                "0901234567",
                LocalDate.of(2000, 5, 10),
                Gender.MALE,
                "Ho Chi Minh City",
                UserStatus.ACTIVE,
                LocalDateTime.of(2026, 9, 3, 12, 30),
                LocalDateTime.of(2026, 9, 3, 13, 0)
        );
    }

    private String validUpdateRequestJson() {
        return """
                {
                  "fullName": "Nguyen Van A",
                  "phone": "0901234567",
                  "dateOfBirth": "2000-05-10",
                  "gender": "MALE",
                  "address": "Ho Chi Minh City"
                }
                """;
    }
}
