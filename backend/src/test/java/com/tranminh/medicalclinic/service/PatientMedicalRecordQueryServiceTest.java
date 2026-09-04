package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.exception.InvalidMedicalRecordSortException;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientMedicalRecordQueryServiceTest {
    @Mock private PatientRepository patientRepository;
    @Mock private MedicalRecordRepository medicalRecordRepository;

    @Test
    void getMyRecords_rejectsMissingPatientProfile() {
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.empty());
        PatientMedicalRecordQueryService service = new PatientMedicalRecordQueryService(patientRepository, medicalRecordRepository);
        assertThrows(PatientProfileNotFoundException.class, () -> service.getMyRecords(1L, 0, 20, "createdAt,desc"));
    }

    @Test
    void getMyRecords_returnsOnlyCurrentPatientRecordsInRequestedOrder() {
        Patient patient = org.mockito.Mockito.mock(Patient.class);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        when(patient.getId()).thenReturn(10L);
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.of(patient));
        when(record.getId()).thenReturn(55L);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getId()).thenReturn(101L);
        when(medicalRecordRepository.findByPatientId(eq(10L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(record)));

        PatientMedicalRecordQueryService service = new PatientMedicalRecordQueryService(patientRepository, medicalRecordRepository);

        assertEquals(55L, service.getMyRecords(1L, 0, 20, "createdAt,asc").content().getFirst().medicalRecordId());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(medicalRecordRepository).findByPatientId(eq(10L), pageableCaptor.capture());
        assertEquals(org.springframework.data.domain.Sort.Direction.ASC, pageableCaptor.getValue().getSort().getOrderFor("createdAt").getDirection());
    }

    @Test
    void getMyRecords_rejectsUnsupportedSort() {
        PatientMedicalRecordQueryService service = new PatientMedicalRecordQueryService(patientRepository, medicalRecordRepository);
        assertThrows(InvalidMedicalRecordSortException.class, () -> service.getMyRecords(1L, 0, 20, "appointmentDate,desc"));
    }
}
