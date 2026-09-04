package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PatientPrescriptionDetailResponse;
import com.tranminh.medicalclinic.dto.response.PatientPrescriptionPageResponse;
import com.tranminh.medicalclinic.dto.response.PatientPrescriptionResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.PatientPrescriptionQueryService;
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

@WebMvcTest(PatientPrescriptionController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class PatientPrescriptionControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private PatientPrescriptionQueryService service;
    @MockitoBean private JwtService jwtService;

    @Test
    void getMyPrescriptions_returnsPageForPatient() throws Exception {
        when(service.getMyPrescriptions(any(), anyInt(), anyInt())).thenReturn(response());

        mockMvc.perform(get("/api/v1/patients/me/prescriptions")
                        .with(authentication(user(1L, "ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].prescriptionId").value(55))
                .andExpect(jsonPath("$.content[0].details[0].medicineName").value("Paracetamol"));
    }

    @Test
    void getMyPrescriptions_returnsForbiddenForDoctor() throws Exception {
        mockMvc.perform(get("/api/v1/patients/me/prescriptions")
                        .with(authentication(user(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private PatientPrescriptionPageResponse response() {
        PatientPrescriptionDetailResponse detail = new PatientPrescriptionDetailResponse(3L, "Paracetamol", "1 tablet", "2/day", "5 days", 10, "After food");
        PatientPrescriptionResponse prescription = new PatientPrescriptionResponse(55L, 101L, 201L, "Take after food", List.of(detail), LocalDateTime.of(2026, 9, 10, 9, 0));
        return new PatientPrescriptionPageResponse(List.of(prescription), 0, 20, 1, 1);
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
