package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateAppointmentRequest;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.AppointmentBookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppointmentController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class AppointmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AppointmentBookingService appointmentBookingService;
    @MockitoBean private JwtService jwtService;

    @Test
    void bookAppointment_returnsCreatedForPatient() throws Exception {
        when(appointmentBookingService.bookAppointment(any(), any(CreateAppointmentRequest.class))).thenReturn(response());

        mockMvc.perform(post("/api/v1/appointments")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.appointmentId").value(101))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.patientId").value(10));
    }

    @Test
    void bookAppointment_returnsForbiddenForNonPatient() throws Exception {
        mockMvc.perform(post("/api/v1/appointments")
                        .with(authentication(authenticatedUser(2L, "ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private AppointmentResponse response() {
        return new AppointmentResponse(101L, 10L, 5L, LocalDate.of(2026, 9, 11), LocalTime.of(10, 0), LocalTime.of(10, 30), AppointmentStatus.PENDING, "Checkup", LocalDateTime.of(2026, 9, 10, 9, 0));
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority(authority)));
    }

    private String validRequestJson() {
        return """
                {"doctorId": 5, "appointmentDate": "2026-09-11", "startTime": "10:00:00", "reason": "Checkup"}
                """;
    }
}
