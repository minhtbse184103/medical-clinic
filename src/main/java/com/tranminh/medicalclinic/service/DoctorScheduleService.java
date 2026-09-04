package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.request.UpdateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.response.DoctorScheduleResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.exception.DoctorScheduleInvalidTimeRangeException;
import com.tranminh.medicalclinic.exception.DoctorScheduleOverlapException;
import com.tranminh.medicalclinic.exception.DoctorScheduleNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class DoctorScheduleService {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;

    public DoctorScheduleService(
            DoctorRepository doctorRepository,
            DoctorScheduleRepository doctorScheduleRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
    }

    @Transactional
    public DoctorScheduleResponse createSchedule(Long doctorId, CreateDoctorScheduleRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new DoctorScheduleInvalidTimeRangeException();
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        boolean overlaps = doctorScheduleRepository
                .existsByDoctor_IdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
                        doctorId,
                        request.dayOfWeek(),
                        request.endTime(),
                        request.startTime()
                );
        if (overlaps) {
            throw new DoctorScheduleOverlapException();
        }

        DoctorSchedule savedSchedule = doctorScheduleRepository.save(new DoctorSchedule(
                doctor,
                request.dayOfWeek(),
                request.startTime(),
                request.endTime()
        ));

        return toResponse(savedSchedule);
    }

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedules(Long doctorId) {
        doctorRepository.findByIdAndUser_Status(doctorId, UserStatus.ACTIVE)
                .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        return doctorScheduleRepository.findByDoctor_Id(doctorId).stream()
                .sorted(Comparator
                        .comparingInt((DoctorSchedule schedule) -> schedule.getDayOfWeek().getValue())
                        .thenComparing(DoctorSchedule::getStartTime))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DoctorScheduleResponse updateSchedule(
            Long doctorId,
            Long scheduleId,
            UpdateDoctorScheduleRequest request
    ) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw new DoctorScheduleInvalidTimeRangeException();
        }

        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        DoctorSchedule schedule = doctorScheduleRepository.findByIdAndDoctor_Id(scheduleId, doctorId)
                .orElseThrow(() -> new DoctorScheduleNotFoundException(scheduleId));

        boolean overlaps = doctorScheduleRepository
                .existsByDoctor_IdAndDayOfWeekAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
                        doctorId,
                        request.dayOfWeek(),
                        scheduleId,
                        request.endTime(),
                        request.startTime()
                );
        if (overlaps) {
            throw new DoctorScheduleOverlapException();
        }

        schedule.update(request.dayOfWeek(), request.startTime(), request.endTime());
        return toResponse(schedule);
    }

    private DoctorScheduleResponse toResponse(DoctorSchedule schedule) {
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getCreatedAt()
        );
    }
}
