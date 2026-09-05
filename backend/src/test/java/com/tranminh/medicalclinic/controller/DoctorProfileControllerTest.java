package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.UpdateDoctorProfileRequest;
import com.tranminh.medicalclinic.dto.response.DoctorProfileResponse;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.DoctorProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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

@WebMvcTest(DoctorProfileController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class DoctorProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DoctorProfileService doctorProfileService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getOwnProfile_returnsProfileForAuthenticatedDoctor() throws Exception {
        when(doctorProfileService.getOwnProfile(7L)).thenReturn(profileResponse());

        mockMvc.perform(get("/api/v1/doctors/me")
                        .with(authentication(authenticatedUser(7L, "ROLE_DOCTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doctorId").value(3))
                .andExpect(jsonPath("$.email").value("doctor1@clinic.local"))
                .andExpect(jsonPath("$.licenseNumber").value("LIC-DEMO-0001"));

        verify(doctorProfileService).getOwnProfile(7L);
    }

    @Test
    void updateOwnProfile_passesTheAuthenticatedUserIdRatherThanAnyClientValue() throws Exception {
        when(doctorProfileService.updateOwnProfile(eq(7L), any(UpdateDoctorProfileRequest.class)))
                .thenReturn(profileResponse());

        mockMvc.perform(put("/api/v1/doctors/me")
                        .with(authentication(authenticatedUser(7L, "ROLE_DOCTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Nguyen Van An",
                                  "phone": "0911111111",
                                  "bio": "Bio moi"
                                }
                                """))
                .andExpect(status().isOk());

        verify(doctorProfileService).updateOwnProfile(eq(7L), any(UpdateDoctorProfileRequest.class));
    }

    @Test
    void updateOwnProfile_returnsBadRequestWhenFullNameIsBlank() throws Exception {
        mockMvc.perform(put("/api/v1/doctors/me")
                        .with(authentication(authenticatedUser(7L, "ROLE_DOCTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"fullName\": \"  \" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.fullName").exists());
    }

    @Test
    void getOwnProfile_returnsForbiddenForNonDoctorRoles() throws Exception {
        mockMvc.perform(get("/api/v1/doctors/me")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/doctors/me")
                        .with(authentication(authenticatedUser(10L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOwnProfile_returnsUnauthorizedWithoutAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/doctors/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    private DoctorProfileResponse profileResponse() {
        return new DoctorProfileResponse(
                3L,
                7L,
                "doctor1@clinic.local",
                "Nguyen Van An",
                "0900000001",
                "Nội tổng quát",
                "LIC-DEMO-0001",
                "Bac si noi tong quat",
                UserStatus.ACTIVE,
                LocalDateTime.of(2026, 9, 5, 8, 0),
                LocalDateTime.of(2026, 9, 5, 8, 0)
        );
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }
}
