package com.tranminh.medicalclinic.dto.response;

import java.time.LocalTime;

public record AvailableSlotResponse(
        LocalTime startTime,
        LocalTime endTime
) {
}
