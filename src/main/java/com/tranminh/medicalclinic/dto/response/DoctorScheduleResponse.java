package com.tranminh.medicalclinic.dto.response;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record DoctorScheduleResponse(
        Long scheduleId,
        Long doctorId,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        LocalDateTime createdAt
) {
}
