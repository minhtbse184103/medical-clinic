package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PrescriptionMedicineResponse;
import com.tranminh.medicalclinic.dto.response.PrescriptionViewResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.PrescriptionQueryService;
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PrescriptionQueryController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class PrescriptionQueryControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private PrescriptionQueryService service;
    @MockitoBean private JwtService jwtService;

    @Test
    void getPrescription_returnsDetailForPatient() throws Exception {
        when(service.getPrescription(any(), anyBoolean(), any())).thenReturn(response());

        mockMvc.perform(get("/api/v1/medical-records/10/prescription")
                        .with(authentication(user(1L, "ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prescriptionId").value(20))
                .andExpect(jsonPath("$.details[0].medicineName").value("Paracetamol"));
    }

    @Test
    void getPrescription_returnsForbiddenForReceptionist() throws Exception {
        mockMvc.perform(get("/api/v1/medical-records/10/prescription")
                        .with(authentication(user(3L, "ROLE_RECEPTIONIST"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private PrescriptionViewResponse response() {
        PrescriptionMedicineResponse detail = new PrescriptionMedicineResponse(3L, "Paracetamol", "1 tablet", "2/day", "5 days", 10, "After food");
        return new PrescriptionViewResponse(20L, 10L, 100L, "Take after food", List.of(detail), LocalDateTime.of(2026, 9, 10, 9, 0));
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
