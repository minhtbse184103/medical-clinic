package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateAppointmentRequest;
import com.tranminh.medicalclinic.dto.request.CreateReceptionistAppointmentRequest;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.AppointmentSlotAlreadyBookedException;
import com.tranminh.medicalclinic.exception.AppointmentSlotNotAvailableException;
import com.tranminh.medicalclinic.exception.AppointmentTimePassedException;
import com.tranminh.medicalclinic.exception.PatientTimeConflictException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentBookingServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long PATIENT_ID = 10L;
    private static final Long DOCTOR_ID = 5L;
    private static final LocalDate DATE = LocalDate.of(2026, 9, 11);

    @Mock private PatientRepository patientRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private DoctorScheduleRepository doctorScheduleRepository;
    @Mock private AppointmentRepository appointmentRepository;

    private AppointmentBookingService appointmentBookingService;

    @BeforeEach
    void setUp() {
        appointmentBookingService = new AppointmentBookingService(
                patientRepository, doctorRepository, doctorScheduleRepository, appointmentRepository,
                Clock.fixed(Instant.parse("2026-09-10T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"))
        );
    }

    @Test
    void bookAppointment_createsPendingAppointmentForAuthenticatedPatient() {
        stubValidBooking();
        when(appointmentRepository.saveAndFlush(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            ReflectionTestUtils.setField(appointment, "id", 101L);
            ReflectionTestUtils.setField(appointment, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
            return appointment;
        });

        AppointmentResponse response = appointmentBookingService.bookAppointment(USER_ID, request(LocalTime.of(10, 0)));

        assertEquals(101L, response.appointmentId());
        assertEquals(PATIENT_ID, response.patientId());
        assertEquals(DOCTOR_ID, response.doctorId());
        assertEquals(LocalTime.of(10, 30), response.endTime());
        assertEquals(AppointmentStatus.PENDING, response.status());
    }

    @Test
    void bookAppointmentForPatient_createsPendingAppointmentForReceptionistFlow() {
        Patient patient = patient();
        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doctor()));
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.FRIDAY))
                .thenReturn(List.of(schedule(LocalTime.of(8, 0), LocalTime.of(12, 0))));
        when(appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any())).thenReturn(false);
        when(appointmentRepository.existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any())).thenReturn(false);
        when(appointmentRepository.saveAndFlush(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            ReflectionTestUtils.setField(appointment, "id", 102L);
            ReflectionTestUtils.setField(appointment, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
            return appointment;
        });

        AppointmentResponse response = appointmentBookingService.bookAppointmentForPatient(
                new CreateReceptionistAppointmentRequest(PATIENT_ID, DOCTOR_ID, DATE, LocalTime.of(10, 0), "Walk-in")
        );

        assertEquals(PATIENT_ID, response.patientId());
        assertEquals(AppointmentStatus.PENDING, response.status());
    }

    @Test
    void bookAppointment_rejectsPastTime() {
        when(patientRepository.findByUser_Id(USER_ID)).thenReturn(Optional.of(patient()));
        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doctor()));

        assertThrows(AppointmentTimePassedException.class,
                () -> appointmentBookingService.bookAppointment(
                        USER_ID,
                        new CreateAppointmentRequest(
                                DOCTOR_ID,
                                DATE.minusDays(2),
                                LocalTime.of(10, 0),
                                "Checkup"
                        )
                ));
    }

    @Test
    void bookAppointment_rejectsSlotOutsideDoctorSchedule() {
        stubPatientAndDoctor();
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.FRIDAY))
                .thenReturn(List.of(schedule(LocalTime.of(8, 0), LocalTime.of(12, 0))));

        assertThrows(AppointmentSlotNotAvailableException.class,
                () -> appointmentBookingService.bookAppointment(USER_ID, request(LocalTime.of(13, 0))));
    }

    @Test
    void bookAppointment_rejectsBookedDoctorSlot() {
        stubPatientAndDoctor();
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.FRIDAY))
                .thenReturn(List.of(schedule(LocalTime.of(8, 0), LocalTime.of(12, 0))));
        when(appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any()))
                .thenReturn(true);

        assertThrows(AppointmentSlotAlreadyBookedException.class,
                () -> appointmentBookingService.bookAppointment(USER_ID, request(LocalTime.of(10, 0))));
    }

    @Test
    void bookAppointment_rejectsPatientTimeConflict() {
        stubValidBooking();
        when(appointmentRepository.existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any()))
                .thenReturn(true);

        assertThrows(PatientTimeConflictException.class,
                () -> appointmentBookingService.bookAppointment(USER_ID, request(LocalTime.of(10, 0))));
    }

    private void stubValidBooking() {
        stubPatientAndDoctor();
        when(doctorScheduleRepository.findByDoctor_IdAndDayOfWeekOrderByStartTime(DOCTOR_ID, DayOfWeek.FRIDAY))
                .thenReturn(List.of(schedule(LocalTime.of(8, 0), LocalTime.of(12, 0))));
        when(appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepository.existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(any(), any(), any(), any()))
                .thenReturn(false);
    }

    private void stubPatientAndDoctor() {
        when(patientRepository.findByUser_Id(USER_ID)).thenReturn(Optional.of(patient()));
        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doctor()));
    }

    private CreateAppointmentRequest request(LocalTime startTime) {
        return new CreateAppointmentRequest(DOCTOR_ID, DATE, startTime, "Checkup");
    }

    private Doctor doctor() {
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        ReflectionTestUtils.setField(doctor, "id", DOCTOR_ID);
        return doctor;
    }

    private Patient patient() {
        Patient patient = new Patient(new User("patient@example.com", "hash", Role.PATIENT), "Patient", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi");
        ReflectionTestUtils.setField(patient, "id", PATIENT_ID);
        return patient;
    }

    private DoctorSchedule schedule(LocalTime startTime, LocalTime endTime) {
        return new DoctorSchedule(doctor(), DayOfWeek.FRIDAY, startTime, endTime);
    }
}
