package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.ReceptionistAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.ReceptionistAppointmentResponse;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.dto.request.CreateReceptionistAppointmentRequest;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.ReceptionistAppointmentQueryService;
import com.tranminh.medicalclinic.service.ReceptionistAppointmentCancellationService;
import com.tranminh.medicalclinic.service.AppointmentBookingService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReceptionistAppointmentController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class ReceptionistAppointmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ReceptionistAppointmentQueryService receptionistAppointmentQueryService;
    @MockitoBean private ReceptionistAppointmentCancellationService receptionistAppointmentCancellationService;
    @MockitoBean private AppointmentBookingService appointmentBookingService;
    @MockitoBean private JwtService jwtService;

    @Test
    void getAppointments_returnsPageForReceptionist() throws Exception {
        when(receptionistAppointmentQueryService.getAppointments(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(response());

        mockMvc.perform(get("/api/v1/receptionist/appointments")
                        .with(authentication(authenticatedUser(3L, "ROLE_RECEPTIONIST")))
                        .param("date", "2026-09-11")
                        .param("doctorId", "5")
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].patientFullName").value("Patient A"))
                .andExpect(jsonPath("$.content[0].doctorSpecialty").value("Cardiology"));
    }

    @Test
    void getAppointments_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(get("/api/v1/receptionist/appointments")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void createAppointment_returnsCreatedForReceptionist() throws Exception {
        when(appointmentBookingService.bookAppointmentForPatient(any(CreateReceptionistAppointmentRequest.class)))
                .thenReturn(new AppointmentResponse(101L, 10L, 5L, LocalDate.of(2026, 9, 11), LocalTime.of(10, 0), LocalTime.of(10, 30), AppointmentStatus.PENDING, "Walk-in", LocalDateTime.of(2026, 9, 10, 9, 0)));

        mockMvc.perform(post("/api/v1/receptionist/appointments")
                        .with(authentication(authenticatedUser(3L, "ROLE_RECEPTIONIST")))
                        .contentType("application/json")
                        .content("{\"patientId\":10,\"doctorId\":5,\"appointmentDate\":\"2026-09-11\",\"startTime\":\"10:00:00\",\"reason\":\"Walk-in\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientId").value(10))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createAppointment_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(post("/api/v1/receptionist/appointments")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT")))
                        .contentType("application/json")
                        .content("{\"patientId\":10,\"doctorId\":5,\"appointmentDate\":\"2026-09-11\",\"startTime\":\"10:00:00\",\"reason\":\"Walk-in\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private ReceptionistAppointmentPageResponse response() {
        ReceptionistAppointmentResponse appointment = new ReceptionistAppointmentResponse(
                101L, 10L, "Patient A", 5L, "Dr. Tran", "Cardiology",
                LocalDate.of(2026, 9, 11), LocalTime.of(10, 0), LocalTime.of(10, 30),
                AppointmentStatus.PENDING, "Checkup", LocalDateTime.of(2026, 9, 10, 9, 0)
        );
        return new ReceptionistAppointmentPageResponse(List.of(appointment), 0, 20, 1, 1);
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority(authority)));
    }
}
