package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.AvailableSlotResponse;
import com.tranminh.medicalclinic.dto.response.AvailableSlotsResponse;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.AvailableSlotService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AvailableSlotController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class AvailableSlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AvailableSlotService availableSlotService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getAvailableSlots_returnsSlotsForAuthenticatedPatient() throws Exception {
        when(availableSlotService.getAvailableSlots(5L, LocalDate.of(2026, 9, 10)))
                .thenReturn(new AvailableSlotsResponse(
                        5L,
                        LocalDate.of(2026, 9, 10),
                        30,
                        List.of(new AvailableSlotResponse(LocalTime.of(8, 0), LocalTime.of(8, 30)))
                ));

        mockMvc.perform(get("/api/v1/doctors/5/available-slots")
                        .param("date", "2026-09-10")
                        .with(authentication(authenticatedUser(9L, "ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doctorId").value(5))
                .andExpect(jsonPath("$.slotDurationMinutes").value(30))
                .andExpect(jsonPath("$.slots[0].startTime").value("08:00:00"));
    }

    @Test
    void getAvailableSlots_returnsUnauthorizedWithoutAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/doctors/5/available-slots").param("date", "2026-09-10"))
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
