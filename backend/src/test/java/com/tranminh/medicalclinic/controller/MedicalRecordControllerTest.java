package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.MedicalRecordService;
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

@WebMvcTest(MedicalRecordController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class MedicalRecordControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private MedicalRecordService medicalRecordService;
    @MockitoBean private JwtService jwtService;

    @Test
    void createMedicalRecord_returnsOkForDoctor() throws Exception {
        when(medicalRecordService.createMedicalRecord(any(), any(), any())).thenReturn(
                new MedicalRecordResponse(55L, 101L, "Fever", "Flu", "Rest", "Observe", LocalDateTime.of(2026, 9, 10, 9, 0))
        );
        mockMvc.perform(post("/api/v1/appointments/101/medical-record")
                        .with(authentication(authenticatedUser(2L, "ROLE_DOCTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symptoms\":\"Fever\",\"diagnosis\":\"Flu\",\"treatment\":\"Rest\",\"notes\":\"Observe\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.medicalRecordId").value(55))
                .andExpect(jsonPath("$.appointmentId").value(101));
    }

    @Test
    void createMedicalRecord_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(post("/api/v1/appointments/101/medical-record")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"diagnosis\":\"Flu\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority(authority)));
    }
}
