package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.request.UpdateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.response.DoctorScheduleResponse;
import com.tranminh.medicalclinic.exception.DoctorScheduleOverlapException;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.DoctorScheduleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DoctorScheduleController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class DoctorScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DoctorScheduleService doctorScheduleService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void createSchedule_returnsCreatedForAdmin() throws Exception {
        when(doctorScheduleService.createSchedule(any(), any(CreateDoctorScheduleRequest.class)))
                .thenReturn(response());

        mockMvc.perform(post("/api/v1/doctors/5/schedules")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.scheduleId").value(12))
                .andExpect(jsonPath("$.doctorId").value(5))
                .andExpect(jsonPath("$.dayOfWeek").value("MONDAY"));
    }

    @Test
    void createSchedule_returnsBadRequestForMissingRequiredField() throws Exception {
        mockMvc.perform(post("/api/v1/doctors/5/schedules")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"dayOfWeek\": \"MONDAY\", \"startTime\": \"08:00:00\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createSchedule_returnsConflictForOverlappingSchedule() throws Exception {
        when(doctorScheduleService.createSchedule(any(), any(CreateDoctorScheduleRequest.class)))
                .thenThrow(new DoctorScheduleOverlapException());

        mockMvc.perform(post("/api/v1/doctors/5/schedules")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DOCTOR_SCHEDULE_OVERLAP"));
    }

    @Test
    void createSchedule_returnsForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/doctors/5/schedules")
                        .with(authentication(authenticatedUser(2L, "ROLE_DOCTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void getSchedules_returnsScheduleForAuthenticatedPatient() throws Exception {
        when(doctorScheduleService.getSchedules(5L)).thenReturn(List.of(response()));

        mockMvc.perform(get("/api/v1/doctors/5/schedules")
                        .with(authentication(authenticatedUser(2L, "ROLE_PATIENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].scheduleId").value(12))
                .andExpect(jsonPath("$[0].dayOfWeek").value("MONDAY"));
    }

    @Test
    void getSchedules_returnsUnauthorizedWithoutAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/doctors/5/schedules"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void updateSchedule_returnsOkForAdmin() throws Exception {
        when(doctorScheduleService.updateSchedule(any(), any(), any(UpdateDoctorScheduleRequest.class)))
                .thenReturn(response());

        mockMvc.perform(put("/api/v1/doctors/5/schedules/12")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduleId").value(12))
                .andExpect(jsonPath("$.startTime").value("08:00:00"));
    }

    @Test
    void updateSchedule_returnsForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(put("/api/v1/doctors/5/schedules/12")
                        .with(authentication(authenticatedUser(2L, "ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void deleteSchedule_returnsNoContentForAdmin() throws Exception {
        mockMvc.perform(delete("/api/v1/doctors/5/schedules/12")
                        .with(authentication(authenticatedUser(1L, "ROLE_ADMIN"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteSchedule_returnsForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(delete("/api/v1/doctors/5/schedules/12")
                        .with(authentication(authenticatedUser(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private DoctorScheduleResponse response() {
        return new DoctorScheduleResponse(
                12L,
                5L,
                DayOfWeek.MONDAY,
                LocalTime.of(8, 0),
                LocalTime.of(12, 0),
                LocalDateTime.of(2026, 9, 4, 9, 0)
        );
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }

    private String validRequestJson() {
        return """
                {
                  "dayOfWeek": "MONDAY",
                  "startTime": "08:00:00",
                  "endTime": "12:00:00"
                }
                """;
    }

    private String updateRequestJson() {
        return """
                {
                  "dayOfWeek": "MONDAY",
                  "startTime": "08:00:00",
                  "endTime": "12:00:00"
                }
                """;
    }
}
