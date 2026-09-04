package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.request.UpdateDoctorScheduleRequest;
import com.tranminh.medicalclinic.dto.response.DoctorScheduleResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorScheduleInvalidTimeRangeException;
import com.tranminh.medicalclinic.exception.DoctorScheduleOverlapException;
import com.tranminh.medicalclinic.exception.DoctorScheduleNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorScheduleServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;

    @InjectMocks
    private DoctorScheduleService doctorScheduleService;

    @Test
    void createSchedule_createsScheduleWhenTimeRangeDoesNotOverlap() {
        Doctor doctor = createDoctor(5L);
        CreateDoctorScheduleRequest request = validRequest();
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.existsByDoctor_IdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
                5L,
                DayOfWeek.MONDAY,
                LocalTime.of(12, 0),
                LocalTime.of(8, 0)
        )).thenReturn(false);
        when(doctorScheduleRepository.save(any(DoctorSchedule.class))).thenAnswer(invocation -> {
            DoctorSchedule schedule = invocation.getArgument(0);
            ReflectionTestUtils.setField(schedule, "id", 12L);
            ReflectionTestUtils.setField(schedule, "createdAt", LocalDateTime.of(2026, 9, 4, 9, 0));
            return schedule;
        });

        DoctorScheduleResponse response = doctorScheduleService.createSchedule(5L, request);

        assertEquals(12L, response.scheduleId());
        assertEquals(5L, response.doctorId());
        assertEquals(DayOfWeek.MONDAY, response.dayOfWeek());
        assertEquals(LocalTime.of(8, 0), response.startTime());
        assertEquals(LocalTime.of(12, 0), response.endTime());
    }

    @Test
    void createSchedule_throwsBadRequestWhenStartIsNotBeforeEnd() {
        CreateDoctorScheduleRequest request = new CreateDoctorScheduleRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(12, 0),
                LocalTime.of(12, 0)
        );

        assertThrows(
                DoctorScheduleInvalidTimeRangeException.class,
                () -> doctorScheduleService.createSchedule(5L, request)
        );

        verify(doctorRepository, never()).findById(any());
        verify(doctorScheduleRepository, never()).save(any());
    }

    @Test
    void createSchedule_throwsConflictWhenScheduleOverlaps() {
        Doctor doctor = createDoctor(5L);
        CreateDoctorScheduleRequest request = validRequest();
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.existsByDoctor_IdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
                eq(5L),
                eq(DayOfWeek.MONDAY),
                eq(LocalTime.of(12, 0)),
                eq(LocalTime.of(8, 0))
        )).thenReturn(true);

        assertThrows(
                DoctorScheduleOverlapException.class,
                () -> doctorScheduleService.createSchedule(5L, request)
        );

        verify(doctorScheduleRepository, never()).save(any());
    }

    @Test
    void getSchedules_returnsActiveDoctorSchedulesInWeeklyOrder() {
        Doctor doctor = createDoctor(5L);
        DoctorSchedule tuesdaySchedule = createSchedule(3L, doctor, DayOfWeek.TUESDAY, 8, 0);
        DoctorSchedule mondayAfternoonSchedule = createSchedule(2L, doctor, DayOfWeek.MONDAY, 13, 0);
        DoctorSchedule mondayMorningSchedule = createSchedule(1L, doctor, DayOfWeek.MONDAY, 8, 0);
        when(doctorRepository.findByIdAndUser_Status(5L, com.tranminh.medicalclinic.enums.UserStatus.ACTIVE))
                .thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByDoctor_Id(5L))
                .thenReturn(List.of(tuesdaySchedule, mondayAfternoonSchedule, mondayMorningSchedule));

        List<DoctorScheduleResponse> responses = doctorScheduleService.getSchedules(5L);

        assertEquals(List.of(1L, 2L, 3L), responses.stream()
                .map(DoctorScheduleResponse::scheduleId)
                .toList());
        verify(doctorScheduleRepository).findByDoctor_Id(5L);
    }

    @Test
    void updateSchedule_updatesScheduleWhenItDoesNotOverlapAnotherSchedule() {
        Doctor doctor = createDoctor(5L);
        DoctorSchedule schedule = createSchedule(12L, doctor, DayOfWeek.MONDAY, 8, 0);
        UpdateDoctorScheduleRequest request = new UpdateDoctorScheduleRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(12, 0)
        );
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByIdAndDoctor_Id(12L, 5L)).thenReturn(Optional.of(schedule));
        when(doctorScheduleRepository.existsByDoctor_IdAndDayOfWeekAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
                5L,
                DayOfWeek.MONDAY,
                12L,
                LocalTime.of(12, 0),
                LocalTime.of(9, 0)
        )).thenReturn(false);

        DoctorScheduleResponse response = doctorScheduleService.updateSchedule(5L, 12L, request);

        assertEquals(LocalTime.of(9, 0), response.startTime());
        assertEquals(LocalTime.of(12, 0), response.endTime());
    }

    @Test
    void updateSchedule_throwsConflictWhenItOverlapsAnotherSchedule() {
        Doctor doctor = createDoctor(5L);
        DoctorSchedule schedule = createSchedule(12L, doctor, DayOfWeek.MONDAY, 8, 0);
        UpdateDoctorScheduleRequest request = new UpdateDoctorScheduleRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(12, 0)
        );
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByIdAndDoctor_Id(12L, 5L)).thenReturn(Optional.of(schedule));
        when(doctorScheduleRepository.existsByDoctor_IdAndDayOfWeekAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
                5L,
                DayOfWeek.MONDAY,
                12L,
                LocalTime.of(12, 0),
                LocalTime.of(9, 0)
        )).thenReturn(true);

        assertThrows(
                DoctorScheduleOverlapException.class,
                () -> doctorScheduleService.updateSchedule(5L, 12L, request)
        );
    }

    @Test
    void updateSchedule_throwsNotFoundWhenScheduleDoesNotBelongToDoctor() {
        Doctor doctor = createDoctor(5L);
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByIdAndDoctor_Id(12L, 5L)).thenReturn(Optional.empty());

        assertThrows(
                DoctorScheduleNotFoundException.class,
                () -> doctorScheduleService.updateSchedule(5L, 12L, validUpdateRequest())
        );
    }

    private CreateDoctorScheduleRequest validRequest() {
        return new CreateDoctorScheduleRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(8, 0),
                LocalTime.of(12, 0)
        );
    }

    private UpdateDoctorScheduleRequest validUpdateRequest() {
        return new UpdateDoctorScheduleRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(12, 0)
        );
    }

    private Doctor createDoctor(Long doctorId) {
        Doctor doctor = new Doctor(
                new User("doctor@example.com", "password-hash", Role.DOCTOR),
                "Dr. Tran B",
                "0900000000",
                "Cardiology",
                "VN-DOC-001",
                "Biography"
        );
        ReflectionTestUtils.setField(doctor, "id", doctorId);
        return doctor;
    }

    private DoctorSchedule createSchedule(
            Long scheduleId,
            Doctor doctor,
            DayOfWeek dayOfWeek,
            int startHour,
            int startMinute
    ) {
        LocalTime startTime = LocalTime.of(startHour, startMinute);
        DoctorSchedule schedule = new DoctorSchedule(
                doctor,
                dayOfWeek,
                startTime,
                startTime.plusHours(4)
        );
        ReflectionTestUtils.setField(schedule, "id", scheduleId);
        ReflectionTestUtils.setField(schedule, "createdAt", LocalDateTime.of(2026, 9, 4, 9, 0));
        return schedule;
    }
}
