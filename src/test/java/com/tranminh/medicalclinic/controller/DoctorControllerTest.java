package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorResponse;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.DoctorQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DoctorController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DoctorQueryService doctorQueryService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getDoctors_returnsPagedPublicDataForAuthenticatedPatient() throws Exception {
        when(doctorQueryService.getDoctors(0, 20, "Cardiology", "tran"))
                .thenReturn(new DoctorPageResponse(
                        List.of(new DoctorResponse(5L, "Dr. Tran B", "0900000000", "Cardiology", "Bio")),
                        0,
                        20,
                        1,
                        1
                ));

        mockMvc.perform(get("/api/v1/doctors")
                        .param("specialty", "Cardiology")
                        .param("name", "tran")
                        .with(authentication(authenticatedUser(10L, "ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].doctorId").value(5))
                .andExpect(jsonPath("$.content[0].fullName").value("Dr. Tran B"))
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(doctorQueryService).getDoctors(0, 20, "Cardiology", "tran");
    }

    @Test
    void getDoctor_returnsNotFoundForInactiveOrMissingDoctor() throws Exception {
        when(doctorQueryService.getDoctor(99L)).thenThrow(new DoctorNotFoundException(99L));

        mockMvc.perform(get("/api/v1/doctors/99")
                        .with(authentication(authenticatedUser(1L, "ROLE_RECEPTIONIST"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DOCTOR_NOT_FOUND"));
    }

    @Test
    void getDoctors_returnsUnauthorizedWithoutAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/doctors"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }
}
