package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.MedicineCatalogResponse;
import com.tranminh.medicalclinic.dto.response.MedicinePageResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.MedicineQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MedicineController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class MedicineControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private MedicineQueryService service;
    @MockitoBean private JwtService jwtService;

    @Test
    void getMedicines_returnsPageForDoctor() throws Exception {
        when(service.getMedicines(any(), any(), anyBoolean(), anyInt(), anyInt())).thenReturn(response());

        mockMvc.perform(get("/api/v1/medicines").param("name", "para").param("active", "true")
                        .with(authentication(user(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Paracetamol"));
    }

    @Test
    void getMedicines_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(get("/api/v1/medicines").with(authentication(user(1L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private MedicinePageResponse response() {
        return new MedicinePageResponse(List.of(new MedicineCatalogResponse(3L, "Paracetamol", "tablet", "Pain relief", true)), 0, 20, 1, 1);
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
