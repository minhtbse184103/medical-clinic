package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
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
class ReceptionistAppointmentCancellationServiceTest {
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private UserRepository userRepository;
    private ReceptionistAppointmentCancellationService service;
    private User receptionist;

    @BeforeEach
    void setUp() {
        service = new ReceptionistAppointmentCancellationService(appointmentRepository, userRepository,
                Clock.fixed(Instant.parse("2026-09-10T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
        receptionist = new User("receptionist@example.com", "hash", Role.RECEPTIONIST);
        ReflectionTestUtils.setField(receptionist, "id", 3L);
    }

    @Test
    void cancel_allowsReceptionistToCancelNearAppointmentTime() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(receptionist));
        Appointment appointment = appointment(AppointmentStatus.CONFIRMED, LocalTime.of(9, 30));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));

        service.cancel(3L, 101L, new CancelAppointmentRequest("Clinic closed"));

        assertEquals(AppointmentStatus.CANCELLED, appointment.getStatus());
    }

    @Test
    void cancel_rejectsTerminalAppointment() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(receptionist));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(AppointmentStatus.COMPLETED, LocalTime.of(9, 30))));

        assertThrows(InvalidAppointmentStatusTransitionException.class,
                () -> service.cancel(3L, 101L, new CancelAppointmentRequest("Reason")));
    }

    private Appointment appointment(AppointmentStatus status, LocalTime startTime) {
        Patient patient = new Patient(new User("patient@example.com", "hash", Role.PATIENT), "Patient", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi");
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        Appointment appointment = new Appointment(patient, doctor, LocalDate.of(2026, 9, 10), startTime, startTime.plusMinutes(30), status, "Checkup");
        ReflectionTestUtils.setField(appointment, "id", 101L);
        return appointment;
    }
}
