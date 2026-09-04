package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.AvailableSlotsResponse;
import com.tranminh.medicalclinic.service.AvailableSlotService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/doctors/{doctorId}/available-slots")
public class AvailableSlotController {

    private final AvailableSlotService availableSlotService;

    public AvailableSlotController(AvailableSlotService availableSlotService) {
        this.availableSlotService = availableSlotService;
    }

    @GetMapping
    public AvailableSlotsResponse getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return availableSlotService.getAvailableSlots(doctorId, date);
    }
}
