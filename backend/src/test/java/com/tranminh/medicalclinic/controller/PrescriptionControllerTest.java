package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.PrescriptionDetailResponse;
import com.tranminh.medicalclinic.dto.response.PrescriptionResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.PrescriptionService;
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

@WebMvcTest(PrescriptionController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class PrescriptionControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private PrescriptionService prescriptionService;
    @MockitoBean private JwtService jwtService;

    @Test
    void createPrescription_returnsCreatedForDoctor() throws Exception {
        when(prescriptionService.createPrescription(any(), any(), any())).thenReturn(new PrescriptionResponse(
                20L, 10L, "After meals", List.of(new PrescriptionDetailResponse(1L, "1 tablet", "twice daily", "5 days", 10, "After meals")), LocalDateTime.of(2026, 9, 10, 9, 0)
        ));
        mockMvc.perform(post("/api/v1/medical-records/10/prescription")
                        .with(authentication(user(2L, "ROLE_DOCTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"After meals\",\"items\":[{\"medicineId\":1,\"dosage\":\"1 tablet\",\"frequency\":\"twice daily\",\"duration\":\"5 days\",\"quantity\":10,\"instruction\":\"After meals\"}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.prescriptionId").value(20));
    }

    @Test
    void createPrescription_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(post("/api/v1/medical-records/10/prescription")
                        .with(authentication(user(1L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[]}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
