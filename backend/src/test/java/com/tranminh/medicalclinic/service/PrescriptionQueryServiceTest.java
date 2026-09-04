package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PrescriptionViewResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.PrescriptionAccessDeniedException;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionQueryServiceTest {

    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PrescriptionDetailRepository prescriptionDetailRepository;

    @Test
    void getPrescription_returnsOnlyPatientsOwnPrescription() {
        Prescription prescription = prescriptionForPatient(1L);
        PrescriptionDetail detail = org.mockito.Mockito.mock(PrescriptionDetail.class);
        Medicine medicine = org.mockito.Mockito.mock(Medicine.class);
        when(prescriptionRepository.findByMedicalRecord_Id(10L)).thenReturn(Optional.of(prescription));
        when(detail.getMedicine()).thenReturn(medicine);
        when(medicine.getId()).thenReturn(3L);
        when(medicine.getName()).thenReturn("Paracetamol");
        when(prescriptionDetailRepository.findByPrescriptionIdsWithMedicine(List.of(20L))).thenReturn(List.of(detail));

        PrescriptionQueryService service = new PrescriptionQueryService(prescriptionRepository, prescriptionDetailRepository);
        PrescriptionViewResponse response = service.getPrescription(1L, false, 10L);

        assertEquals(20L, response.prescriptionId());
        assertEquals("Paracetamol", response.details().getFirst().medicineName());
    }

    @Test
    void getPrescription_rejectsPatientWhoDoesNotOwnPrescription() {
        Prescription prescription = org.mockito.Mockito.mock(Prescription.class);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        Patient patient = org.mockito.Mockito.mock(Patient.class);
        User patientUser = new User("patient@example.com", "hash", Role.PATIENT);
        ReflectionTestUtils.setField(patientUser, "id", 1L);
        when(prescription.getMedicalRecord()).thenReturn(record);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getPatient()).thenReturn(patient);
        when(patient.getUser()).thenReturn(patientUser);
        when(prescriptionRepository.findByMedicalRecord_Id(10L)).thenReturn(Optional.of(prescription));
        PrescriptionQueryService service = new PrescriptionQueryService(prescriptionRepository, prescriptionDetailRepository);

        assertThrows(PrescriptionAccessDeniedException.class, () -> service.getPrescription(2L, false, 10L));
    }

    @Test
    void getPrescription_returnsDetailForDoctorWhoOwnsAppointment() {
        Prescription prescription = prescriptionForDoctor(2L);
        when(prescriptionRepository.findByMedicalRecord_Id(10L)).thenReturn(Optional.of(prescription));
        when(prescriptionDetailRepository.findByPrescriptionIdsWithMedicine(List.of(20L))).thenReturn(List.of());
        PrescriptionQueryService service = new PrescriptionQueryService(prescriptionRepository, prescriptionDetailRepository);

        assertEquals(20L, service.getPrescription(2L, true, 10L).prescriptionId());
    }

    private Prescription prescriptionForPatient(Long patientUserId) {
        Prescription prescription = org.mockito.Mockito.mock(Prescription.class);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        Patient patient = org.mockito.Mockito.mock(Patient.class);
        User patientUser = new User("patient@example.com", "hash", Role.PATIENT);
        ReflectionTestUtils.setField(patientUser, "id", patientUserId);
        when(prescription.getId()).thenReturn(20L);
        when(prescription.getMedicalRecord()).thenReturn(record);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getId()).thenReturn(100L);
        when(appointment.getPatient()).thenReturn(patient);
        when(patient.getUser()).thenReturn(patientUser);
        return prescription;
    }

    private Prescription prescriptionForDoctor(Long doctorUserId) {
        Prescription prescription = org.mockito.Mockito.mock(Prescription.class);
        MedicalRecord record = org.mockito.Mockito.mock(MedicalRecord.class);
        Appointment appointment = org.mockito.Mockito.mock(Appointment.class);
        Doctor doctor = org.mockito.Mockito.mock(Doctor.class);
        when(prescription.getId()).thenReturn(20L);
        when(prescription.getMedicalRecord()).thenReturn(record);
        when(record.getAppointment()).thenReturn(appointment);
        when(appointment.getId()).thenReturn(100L);
        User doctorUser = new User("doctor@example.com", "hash", Role.DOCTOR);
        ReflectionTestUtils.setField(doctorUser, "id", doctorUserId);
        when(appointment.getDoctor()).thenReturn(doctor);
        when(doctor.getUser()).thenReturn(doctorUser);
        return prescription;
    }
}
