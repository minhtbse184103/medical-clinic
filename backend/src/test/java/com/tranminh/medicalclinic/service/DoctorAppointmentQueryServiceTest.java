package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorAppointmentPageResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorAppointmentQueryServiceTest {

    private static final Long USER_ID = 2L;
    private static final Long DOCTOR_ID = 5L;

    @Mock private DoctorRepository doctorRepository;
    @Mock private AppointmentRepository appointmentRepository;

    private DoctorAppointmentQueryService doctorAppointmentQueryService;

    @BeforeEach
    void setUp() {
        doctorAppointmentQueryService = new DoctorAppointmentQueryService(doctorRepository, appointmentRepository);
    }

    @Test
    void getMyAppointments_returnsOnlyAuthenticatedDoctorsAppointments() {
        when(doctorRepository.findByUser_Id(USER_ID)).thenReturn(Optional.of(doctor()));
        when(appointmentRepository.findDoctorAppointments(eq(DOCTOR_ID), eq(LocalDate.of(2026, 9, 11)), eq(AppointmentStatus.CONFIRMED), any()))
                .thenReturn(new PageImpl<>(List.of(appointment())));

        DoctorAppointmentPageResponse response = doctorAppointmentQueryService.getMyAppointments(
                USER_ID, LocalDate.of(2026, 9, 11), AppointmentStatus.CONFIRMED, 0, 20
        );

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(appointmentRepository).findDoctorAppointments(
                eq(DOCTOR_ID), eq(LocalDate.of(2026, 9, 11)), eq(AppointmentStatus.CONFIRMED), pageableCaptor.capture()
        );
        assertEquals("appointmentDate: ASC,startTime: ASC", pageableCaptor.getValue().getSort().toString());
        assertEquals(101L, response.content().getFirst().appointmentId());
        assertEquals("Patient A", response.content().getFirst().patientFullName());
    }

    @Test
    void getMyAppointments_rejectsMissingDoctorProfile() {
        when(doctorRepository.findByUser_Id(USER_ID)).thenReturn(Optional.empty());

        assertThrows(DoctorProfileNotFoundException.class,
                () -> doctorAppointmentQueryService.getMyAppointments(USER_ID, null, null, 0, 20));
    }

    private Doctor doctor() {
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        ReflectionTestUtils.setField(doctor, "id", DOCTOR_ID);
        return doctor;
    }

    private Appointment appointment() {
        Patient patient = new Patient(
                new User("patient@example.com", "hash", Role.PATIENT),
                "Patient A", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi"
        );
        ReflectionTestUtils.setField(patient, "id", 10L);
        Appointment appointment = new Appointment(
                patient, doctor(), LocalDate.of(2026, 9, 11), LocalTime.of(10, 0),
                LocalTime.of(10, 30), AppointmentStatus.CONFIRMED, "Checkup"
        );
        ReflectionTestUtils.setField(appointment, "id", 101L);
        ReflectionTestUtils.setField(appointment, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
        return appointment;
    }
}
