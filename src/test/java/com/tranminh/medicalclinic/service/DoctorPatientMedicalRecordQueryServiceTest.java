package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorPatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorPatientMedicalRecordAccessDeniedException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

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
class DoctorPatientMedicalRecordQueryServiceTest {

    @Mock private DoctorRepository doctorRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private MedicalRecordRepository medicalRecordRepository;

    private DoctorPatientMedicalRecordQueryService service;

    @BeforeEach
    void setUp() {
        service = new DoctorPatientMedicalRecordQueryService(
                doctorRepository, patientRepository, appointmentRepository, medicalRecordRepository
        );
    }

    @Test
    void getPatientMedicalRecords_returnsRecordsWhenDoctorHasClinicalRelationship() {
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.of(doctor()));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(org.mockito.Mockito.mock(Patient.class)));
        when(appointmentRepository.existsByDoctor_IdAndPatient_Id(5L, 10L)).thenReturn(true);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        when(record.getId()).thenReturn(55L);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getId()).thenReturn(101L);
        when(medicalRecordRepository.findByPatientId(eq(10L), any())).thenReturn(new PageImpl<>(List.of(record)));

        DoctorPatientMedicalRecordPageResponse response = service.getPatientMedicalRecords(2L, 10L, 0, 20);

        assertEquals(10L, response.patientId());
        assertEquals(55L, response.content().getFirst().medicalRecordId());
        verify(medicalRecordRepository).findByPatientId(eq(10L), any());
    }

    @Test
    void getPatientMedicalRecords_rejectsDoctorWithoutClinicalRelationship() {
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.of(doctor()));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(org.mockito.Mockito.mock(Patient.class)));
        when(appointmentRepository.existsByDoctor_IdAndPatient_Id(5L, 10L)).thenReturn(false);

        assertThrows(DoctorPatientMedicalRecordAccessDeniedException.class,
                () -> service.getPatientMedicalRecords(2L, 10L, 0, 20));
        verify(medicalRecordRepository, never()).findByPatientId(eq(10L), any());
    }

    private Doctor doctor() {
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        ReflectionTestUtils.setField(doctor, "id", 5L);
        return doctor;
    }
}
