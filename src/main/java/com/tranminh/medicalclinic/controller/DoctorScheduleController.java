package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.request.UpdateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.response.DoctorScheduleResponse;
import com.tranminh.medicalclinic.service.DoctorScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors/{doctorId}/schedules")
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    public DoctorScheduleController(DoctorScheduleService doctorScheduleService) {
        this.doctorScheduleService = doctorScheduleService;
    }

    @PostMapping
    public ResponseEntity<DoctorScheduleResponse> createSchedule(
            @PathVariable Long doctorId,
            @Valid @RequestBody CreateDoctorScheduleRequest request
    ) {
        DoctorScheduleResponse response = doctorScheduleService.createSchedule(doctorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<DoctorScheduleResponse> getSchedules(@PathVariable Long doctorId) {
        return doctorScheduleService.getSchedules(doctorId);
    }

    @PutMapping("/{scheduleId}")
    public DoctorScheduleResponse updateSchedule(
            @PathVariable Long doctorId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateDoctorScheduleRequest request
    ) {
        return doctorScheduleService.updateSchedule(doctorId, scheduleId, request);
    }
}
