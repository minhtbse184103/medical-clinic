package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PatientAppointmentPageResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.InvalidAppointmentDateRangeException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentSortException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
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
class PatientAppointmentQueryServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long PATIENT_ID = 10L;

    @Mock private PatientRepository patientRepository;
    @Mock private AppointmentRepository appointmentRepository;

    private PatientAppointmentQueryService patientAppointmentQueryService;

    @BeforeEach
    void setUp() {
        patientAppointmentQueryService = new PatientAppointmentQueryService(patientRepository, appointmentRepository);
    }

    @Test
    void getMyAppointments_returnsOnlyAuthenticatedPatientsAppointments() {
        when(patientRepository.findByUser_Id(USER_ID)).thenReturn(Optional.of(patient()));
        when(appointmentRepository.findPatientAppointments(eq(PATIENT_ID), eq(AppointmentStatus.PENDING), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(appointment())));

        PatientAppointmentPageResponse response = patientAppointmentQueryService.getMyAppointments(
                USER_ID,
                AppointmentStatus.PENDING,
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30),
                0,
                20,
                "appointmentDate,desc"
        );

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(appointmentRepository).findPatientAppointments(
                eq(PATIENT_ID), eq(AppointmentStatus.PENDING),
                eq(LocalDate.of(2026, 9, 1)), eq(LocalDate.of(2026, 9, 30)), pageableCaptor.capture()
        );
        assertEquals("appointmentDate: DESC,startTime: DESC", pageableCaptor.getValue().getSort().toString());
        assertEquals(101L, response.content().getFirst().appointmentId());
        assertEquals("Dr. Tran", response.content().getFirst().doctorFullName());
        assertEquals(1, response.totalElements());
    }

    @Test
    void getMyAppointments_rejectsInvalidDateRange() {
        assertThrows(InvalidAppointmentDateRangeException.class, () -> patientAppointmentQueryService.getMyAppointments(
                USER_ID, null, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 9, 1), 0, 20, "appointmentDate,desc"
        ));
    }

    @Test
    void getMyAppointments_rejectsUnsupportedSort() {
        assertThrows(InvalidAppointmentSortException.class, () -> patientAppointmentQueryService.getMyAppointments(
                USER_ID, null, null, null, 0, 20, "doctorFullName,asc"
        ));
    }

    private Patient patient() {
        Patient patient = new Patient(
                new User("patient@example.com", "hash", Role.PATIENT),
                "Patient", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi"
        );
        ReflectionTestUtils.setField(patient, "id", PATIENT_ID);
        return patient;
    }

    private Appointment appointment() {
        Doctor doctor = new Doctor(
                new User("doctor@example.com", "hash", Role.DOCTOR),
                "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio"
        );
        ReflectionTestUtils.setField(doctor, "id", 5L);
        Appointment appointment = new Appointment(
                patient(), doctor, LocalDate.of(2026, 9, 11), LocalTime.of(10, 0),
                LocalTime.of(10, 30), AppointmentStatus.PENDING, "Checkup"
        );
        ReflectionTestUtils.setField(appointment, "id", 101L);
        ReflectionTestUtils.setField(appointment, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
        return appointment;
    }
}
