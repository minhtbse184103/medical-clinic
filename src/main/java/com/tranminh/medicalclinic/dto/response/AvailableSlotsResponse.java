package com.tranminh.medicalclinic.dto.response;

import java.time.LocalDate;
import java.util.List;

public record AvailableSlotsResponse(
        Long doctorId,
        LocalDate date,
        int slotDurationMinutes,
        List<AvailableSlotResponse> slots
) {
}
