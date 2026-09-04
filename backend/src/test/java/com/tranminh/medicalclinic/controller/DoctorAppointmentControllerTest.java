package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.DoctorAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorAppointmentResponse;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.DoctorAppointmentQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DoctorAppointmentController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class DoctorAppointmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private DoctorAppointmentQueryService doctorAppointmentQueryService;
    @MockitoBean private JwtService jwtService;

    @Test
    void getMyAppointments_returnsPageForDoctor() throws Exception {
        when(doctorAppointmentQueryService.getMyAppointments(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(response());

        mockMvc.perform(get("/api/v1/doctor/appointments")
                        .with(authentication(authenticatedUser(2L, "ROLE_DOCTOR")))
                        .param("date", "2026-09-11")
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].appointmentId").value(101))
                .andExpect(jsonPath("$.content[0].patientFullName").value("Patient A"));
    }

    @Test
    void getMyAppointments_returnsForbiddenForNonDoctor() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/appointments")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private DoctorAppointmentPageResponse response() {
        DoctorAppointmentResponse appointment = new DoctorAppointmentResponse(
                101L, 10L, "Patient A", LocalDate.of(2026, 9, 11),
                LocalTime.of(10, 0), LocalTime.of(10, 30), AppointmentStatus.CONFIRMED,
                "Checkup", LocalDateTime.of(2026, 9, 10, 9, 0)
        );
        return new DoctorAppointmentPageResponse(List.of(appointment), 0, 20, 1, 1);
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority(authority)));
    }
}
