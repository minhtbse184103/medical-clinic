package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.AvailableSlotsResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailableSlotServiceTest {

    private static final Long DOCTOR_ID = 5L;
    private static final LocalDate DATE = LocalDate.of(2026, 9, 10);

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    private AvailableSlotService availableSlotService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(
                Instant.parse("2026-09-10T02:15:00Z"),
                ZoneId.of("Asia/Ho_Chi_Minh")
        );
        availableSlotService = new AvailableSlotService(
                doctorRepository,
                doctorScheduleRepository,
                appointmentRepository,
                clock
        );
    }

    @Test
    void getAvailableSlots_generatesSlotsAndExcludesActiveAppointments() {
        Doctor doctor = createDoctor();
        LocalDate futureDate = DATE.plusDays(1);
        DoctorSchedule schedule = new DoctorSchedule(
                doctor,
                DayOfWeek.FRIDAY,
                LocalTime.of(8, 0),
                LocalTime.of(10, 0)
        );
        Appointment appointment = new Appointment(
                createPatient(),
                doctor,
                futureDate,
                LocalTime.of(8, 30),
                LocalTime.of(9, 0),
                AppointmentStatus.PENDING,
                "Checkup"
        );
        when(doctorRepository.findByIdAndUser_Status(DOCTOR_ID, UserStatus.ACTIVE))
                .thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.FRIDAY))
                .thenReturn(List.of(schedule));
        when(appointmentRepository.findByDoctor_IdAndAppointmentDateAndStatusIn(any(), any(), any()))
                .thenReturn(List.of(appointment));

        AvailableSlotsResponse response = availableSlotService.getAvailableSlots(DOCTOR_ID, futureDate);

        assertEquals(30, response.slotDurationMinutes());
        assertEquals(List.of(
                LocalTime.of(8, 0),
                LocalTime.of(9, 0),
                LocalTime.of(9, 30)
        ), response.slots().stream().map(slot -> slot.startTime()).toList());
    }

    @Test
    void getAvailableSlots_excludesSlotsThatAlreadyPassedToday() {
        Doctor doctor = createDoctor();
        DoctorSchedule schedule = new DoctorSchedule(
                doctor,
                DayOfWeek.THURSDAY,
                LocalTime.of(9, 0),
                LocalTime.of(11, 0)
        );
        when(doctorRepository.findByIdAndUser_Status(DOCTOR_ID, UserStatus.ACTIVE))
                .thenReturn(Optional.of(doctor));
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.THURSDAY))
                .thenReturn(List.of(schedule));
        when(appointmentRepository.findByDoctor_IdAndAppointmentDateAndStatusIn(any(), any(), any()))
                .thenReturn(List.of());

        AvailableSlotsResponse response = availableSlotService.getAvailableSlots(DOCTOR_ID, DATE);

        assertEquals(List.of(
                LocalTime.of(9, 30),
                LocalTime.of(10, 0),
                LocalTime.of(10, 30)
        ), response.slots().stream().map(slot -> slot.startTime()).toList());
    }

    @Test
    void getAvailableSlots_returnsEmptyListForPastDate() {
        Doctor doctor = createDoctor();
        when(doctorRepository.findByIdAndUser_Status(DOCTOR_ID, UserStatus.ACTIVE))
                .thenReturn(Optional.of(doctor));

        AvailableSlotsResponse response = availableSlotService.getAvailableSlots(
                DOCTOR_ID,
                DATE.minusDays(1)
        );

        assertEquals(List.of(), response.slots());
        verify(doctorScheduleRepository, never()).findByDoctor_IdAndDayOfWeekOrderByStartTime(any(), any());
        verify(appointmentRepository, never()).findByDoctor_IdAndAppointmentDateAndStatusIn(any(), any(), any());
    }

    private Doctor createDoctor() {
        Doctor doctor = new Doctor(
                new User("doctor@example.com", "password-hash", Role.DOCTOR),
                "Dr. Tran B",
                "0900000000",
                "Cardiology",
                "VN-DOC-001",
                "Biography"
        );
        ReflectionTestUtils.setField(doctor, "id", DOCTOR_ID);
        return doctor;
    }

    private Patient createPatient() {
        Patient patient = new Patient(
                new User("patient@example.com", "password-hash", Role.PATIENT),
                "Patient A",
                "0900000001",
                LocalDate.of(2000, 1, 1),
                Gender.OTHER,
                "Ha Noi"
        );
        ReflectionTestUtils.setField(patient, "id", 8L);
        return patient;
    }
}
