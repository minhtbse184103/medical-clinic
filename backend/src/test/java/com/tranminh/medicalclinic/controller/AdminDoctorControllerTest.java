package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateDoctorRequest;
import com.tranminh.medicalclinic.dto.response.CreateDoctorResponse;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorLicenseNumberAlreadyExistsException;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.AdminDoctorService;
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
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminDoctorController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class AdminDoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminDoctorService adminDoctorService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void createDoctor_returnsCreatedForAdmin() throws Exception {
        when(adminDoctorService.createDoctor(any(CreateDoctorRequest.class)))
                .thenReturn(response());

        mockMvc.perform(post("/api/v1/admin/doctors")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doctorId").value(2))
                .andExpect(jsonPath("$.email").value("doctor@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createDoctor_returnsBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/v1/admin/doctors")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"email\": \"invalid\", \"temporaryPassword\": \"short\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createDoctor_returnsConflictWhenLicenseNumberAlreadyExists() throws Exception {
        when(adminDoctorService.createDoctor(any(CreateDoctorRequest.class)))
                .thenThrow(new DoctorLicenseNumberAlreadyExistsException("VN-DOC-001"));

        mockMvc.perform(post("/api/v1/admin/doctors")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DOCTOR_LICENSE_NUMBER_ALREADY_EXISTS"));
    }

    @Test
    void createDoctor_returnsForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/admin/doctors")
                        .with(authentication(authenticatedUser(5L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }

    private CreateDoctorResponse response() {
        return new CreateDoctorResponse(
                1L,
                2L,
                "doctor@example.com",
                "Dr. Tran B",
                "0900000000",
                "Internal Medicine",
                "VN-DOC-001",
                "Doctor biography",
                UserStatus.ACTIVE,
                LocalDateTime.of(2026, 9, 3, 15, 0)
        );
    }

    private String validRequestJson() {
        return """
                {
                  "email": "doctor@example.com",
                  "temporaryPassword": "Temp123!",
                  "fullName": "Dr. Tran B",
                  "phone": "0900000000",
                  "specialty": "Internal Medicine",
                  "licenseNumber": "VN-DOC-001",
                  "bio": "Doctor biography"
                }
                """;
    }
}
