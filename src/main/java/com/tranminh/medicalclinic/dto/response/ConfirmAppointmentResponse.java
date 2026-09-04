package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.AppointmentStatus;

import java.time.LocalDateTime;

public record ConfirmAppointmentResponse(
        Long appointmentId,
        AppointmentStatus status,
        LocalDateTime confirmedAt
) {
}
