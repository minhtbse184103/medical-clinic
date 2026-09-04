package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateAppointmentRequest;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.dto.response.ConfirmAppointmentResponse;
import com.tranminh.medicalclinic.dto.response.PatientAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.PatientAppointmentResponse;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.AppointmentBookingService;
import com.tranminh.medicalclinic.service.PatientAppointmentQueryService;
import com.tranminh.medicalclinic.service.AppointmentConfirmationService;
import com.tranminh.medicalclinic.service.PatientAppointmentCancellationService;
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
import static org.mockito.ArgumentMatchers.anyInt;
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
    @MockitoBean private PatientAppointmentQueryService patientAppointmentQueryService;
    @MockitoBean private AppointmentConfirmationService appointmentConfirmationService;
    @MockitoBean private PatientAppointmentCancellationService patientAppointmentCancellationService;
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

    @Test
    void getMyAppointments_returnsPageForPatient() throws Exception {
        when(patientAppointmentQueryService.getMyAppointments(any(), any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(pageResponse());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/appointments/me")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT")))
                        .param("status", "PENDING")
                        .param("fromDate", "2026-09-01")
                        .param("toDate", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].appointmentId").value(101))
                .andExpect(jsonPath("$.content[0].doctorFullName").value("Dr. Tran"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getMyAppointments_returnsForbiddenForNonPatient() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/appointments/me")
                        .with(authentication(authenticatedUser(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void confirmAppointment_returnsConfirmedForReceptionist() throws Exception {
        when(appointmentConfirmationService.confirm(any(), any()))
                .thenReturn(new ConfirmAppointmentResponse(101L, AppointmentStatus.CONFIRMED, LocalDateTime.of(2026, 9, 10, 9, 0)));

        mockMvc.perform(post("/api/v1/appointments/101/confirm")
                        .with(authentication(authenticatedUser(3L, "ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(101))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void confirmAppointment_returnsForbiddenForPatient() throws Exception {
        mockMvc.perform(post("/api/v1/appointments/101/confirm")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void cancelAppointment_returnsOkForPatient() throws Exception {
        mockMvc.perform(post("/api/v1/appointments/101/cancel")
                        .with(authentication(authenticatedUser(1L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Unexpected work\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void cancelAppointment_returnsForbiddenForReceptionist() throws Exception {
        mockMvc.perform(post("/api/v1/appointments/101/cancel")
                        .with(authentication(authenticatedUser(3L, "ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Unexpected work\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private AppointmentResponse response() {
        return new AppointmentResponse(101L, 10L, 5L, LocalDate.of(2026, 9, 11), LocalTime.of(10, 0), LocalTime.of(10, 30), AppointmentStatus.PENDING, "Checkup", LocalDateTime.of(2026, 9, 10, 9, 0));
    }

    private PatientAppointmentPageResponse pageResponse() {
        PatientAppointmentResponse appointment = new PatientAppointmentResponse(
                101L, 5L, "Dr. Tran", "Cardiology", LocalDate.of(2026, 9, 11),
                LocalTime.of(10, 0), LocalTime.of(10, 30), AppointmentStatus.PENDING,
                "Checkup", LocalDateTime.of(2026, 9, 10, 9, 0)
        );
        return new PatientAppointmentPageResponse(List.of(appointment), 0, 20, 1, 1);
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
