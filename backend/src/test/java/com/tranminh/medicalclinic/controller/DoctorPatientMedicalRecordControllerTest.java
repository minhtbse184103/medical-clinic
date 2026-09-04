package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorPatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.DoctorPatientMedicalRecordQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DoctorPatientMedicalRecordController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class DoctorPatientMedicalRecordControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private DoctorPatientMedicalRecordQueryService service;
    @MockitoBean private JwtService jwtService;

    @Test
    void getPatientMedicalRecords_returnsPageForDoctor() throws Exception {
        when(service.getPatientMedicalRecords(any(), any(), anyInt(), anyInt())).thenReturn(response());

        mockMvc.perform(get("/api/v1/doctor/patients/10/medical-records")
                        .with(authentication(user(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(10))
                .andExpect(jsonPath("$.content[0].medicalRecordId").value(55));
    }

    @Test
    void getPatientMedicalRecords_returnsForbiddenForPatientRole() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/patients/10/medical-records")
                        .with(authentication(user(1L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private DoctorPatientMedicalRecordPageResponse response() {
        return new DoctorPatientMedicalRecordPageResponse(
                10L,
                List.of(new MedicalRecordResponse(55L, 101L, "Fever", "Flu", "Rest", "Observe", LocalDateTime.of(2026, 9, 10, 9, 0))),
                0, 20, 1, 1
        );
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
