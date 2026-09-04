package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record DoctorAppointmentResponse(
        Long appointmentId,
        Long patientId,
        String patientFullName,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        AppointmentStatus status,
        String reason,
        LocalDateTime createdAt
) {
}
