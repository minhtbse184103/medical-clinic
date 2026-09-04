package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PatientPrescriptionPageResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientPrescriptionQueryServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PrescriptionDetailRepository prescriptionDetailRepository;

    @Test
    void getMyPrescriptions_returnsOnlyAuthenticatedPatientsPrescriptionsWithMedicineName() {
        Patient patient = org.mockito.Mockito.mock(Patient.class);
        Prescription prescription = org.mockito.Mockito.mock(Prescription.class);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        PrescriptionDetail detail = org.mockito.Mockito.mock(PrescriptionDetail.class);
        Medicine medicine = org.mockito.Mockito.mock(Medicine.class);
        when(patient.getId()).thenReturn(10L);
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.of(patient));
        when(prescription.getId()).thenReturn(55L);
        when(prescription.getMedicalRecord()).thenReturn(record);
        when(record.getId()).thenReturn(101L);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getId()).thenReturn(201L);
        when(prescriptionRepository.findByPatientId(eq(10L), any())).thenReturn(new PageImpl<>(List.of(prescription)));
        when(detail.getPrescription()).thenReturn(prescription);
        when(detail.getMedicine()).thenReturn(medicine);
        when(medicine.getId()).thenReturn(3L);
        when(medicine.getName()).thenReturn("Paracetamol");
        when(prescriptionDetailRepository.findByPrescriptionIdsWithMedicine(List.of(55L))).thenReturn(List.of(detail));

        PatientPrescriptionQueryService service = new PatientPrescriptionQueryService(patientRepository, prescriptionRepository, prescriptionDetailRepository);
        PatientPrescriptionPageResponse response = service.getMyPrescriptions(1L, 0, 20);

        assertEquals(55L, response.content().getFirst().prescriptionId());
        assertEquals("Paracetamol", response.content().getFirst().details().getFirst().medicineName());
        verify(prescriptionRepository).findByPatientId(eq(10L), any());
    }

    @Test
    void getMyPrescriptions_rejectsMissingPatientProfile() {
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.empty());
        PatientPrescriptionQueryService service = new PatientPrescriptionQueryService(patientRepository, prescriptionRepository, prescriptionDetailRepository);
        assertThrows(PatientProfileNotFoundException.class, () -> service.getMyPrescriptions(1L, 0, 20));
    }
}
