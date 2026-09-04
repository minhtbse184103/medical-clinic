package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateReceptionistAppointmentRequest(
        @NotNull @Positive Long patientId,
        @NotNull @Positive Long doctorId,
        @NotNull LocalDate appointmentDate,
        @NotNull LocalTime startTime,
        @NotBlank @Size(max = 500) String reason
) {
}
