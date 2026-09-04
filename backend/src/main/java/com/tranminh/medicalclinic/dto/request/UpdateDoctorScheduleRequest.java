package com.tranminh.medicalclinic.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record UpdateDoctorScheduleRequest(
        @NotNull(message = "Day of week is required.")
        DayOfWeek dayOfWeek,

        @NotNull(message = "Start time is required.")
        LocalTime startTime,

        @NotNull(message = "End time is required.")
        LocalTime endTime
) {
}
