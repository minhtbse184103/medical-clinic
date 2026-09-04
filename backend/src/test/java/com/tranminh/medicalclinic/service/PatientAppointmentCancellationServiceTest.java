package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.AppointmentCancellationDeadlinePassedException;
import com.tranminh.medicalclinic.exception.AppointmentOwnershipException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentStatusTransitionException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientAppointmentCancellationServiceTest {
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private UserRepository userRepository;
    private PatientAppointmentCancellationService service;
    private User patientUser;

    @BeforeEach
    void setUp() {
        service = new PatientAppointmentCancellationService(appointmentRepository, userRepository,
                Clock.fixed(Instant.parse("2026-09-10T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
        patientUser = new User("patient@example.com", "hash", Role.PATIENT);
        ReflectionTestUtils.setField(patientUser, "id", 1L);
    }

    @Test
    void cancel_cancelsOwnedFuturePendingAppointment() {
        Appointment appointment = appointment(1L, AppointmentStatus.PENDING, LocalTime.of(12, 0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        service.cancel(1L, 101L, new CancelAppointmentRequest("Unexpected work"));

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
    }

    @Test
    void cancel_rejectsAppointmentOwnedByAnotherPatient() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(2L, AppointmentStatus.PENDING, LocalTime.of(12, 0))));

        assertThrows(AppointmentOwnershipException.class,
                () -> service.cancel(1L, 101L, new CancelAppointmentRequest("Reason")));
    }

    @Test
    void cancel_rejectsDeadlineLessThanTwoHours() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(1L, AppointmentStatus.PENDING, LocalTime.of(10, 30))));

        assertThrows(AppointmentCancellationDeadlinePassedException.class,
                () -> service.cancel(1L, 101L, new CancelAppointmentRequest("Reason")));
    }

    @Test
    void cancel_rejectsTerminalStatus() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(1L, AppointmentStatus.CANCELLED, LocalTime.of(12, 0))));

        assertThrows(InvalidAppointmentStatusTransitionException.class,
                () -> service.cancel(1L, 101L, new CancelAppointmentRequest("Reason")));
    }

    private Appointment appointment(Long ownerUserId, AppointmentStatus status, LocalTime startTime) {
        User owner = ownerUserId.equals(1L) ? patientUser : new User("other@example.com", "hash", Role.PATIENT);
        ReflectionTestUtils.setField(owner, "id", ownerUserId);
        Patient patient = new Patient(owner, "Patient", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi");
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        Appointment appointment = new Appointment(patient, doctor, LocalDate.of(2026, 9, 10), startTime, startTime.plusMinutes(30), status, "Checkup");
        ReflectionTestUtils.setField(appointment, "id", 101L);
        return appointment;
    }
}
