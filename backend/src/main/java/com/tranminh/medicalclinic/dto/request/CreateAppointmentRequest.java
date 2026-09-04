package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateAppointmentRequest(
        @NotNull(message = "Doctor ID is required.")
        @Positive(message = "Doctor ID must be positive.")
        Long doctorId,

        @NotNull(message = "Appointment date is required.")
        LocalDate appointmentDate,

        @NotNull(message = "Start time is required.")
        LocalTime startTime,

        @NotBlank(message = "Reason is required.")
        @Size(max = 500, message = "Reason must not exceed 500 characters.")
        String reason
) {
}
