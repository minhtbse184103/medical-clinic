package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreatePrescriptionDetailRequest;
import com.tranminh.medicalclinic.dto.request.CreatePrescriptionRequest;
import com.tranminh.medicalclinic.dto.response.PrescriptionResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorAppointmentAccessDeniedException;
import com.tranminh.medicalclinic.exception.MedicineNotAvailableException;
import com.tranminh.medicalclinic.exception.PrescriptionAlreadyExistsException;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.MedicineRepository;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {
    @Mock private MedicalRecordRepository medicalRecordRepository;
    @Mock private MedicineRepository medicineRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PrescriptionDetailRepository prescriptionDetailRepository;
    @Mock private MedicalRecord medicalRecord;
    @Mock private Appointment appointment;
    @Mock private Doctor doctor;
    @Mock private User doctorUser;
    @Mock private Medicine medicine;
    private PrescriptionService service;

    @BeforeEach
    void setUp() {
        service = new PrescriptionService(medicalRecordRepository, medicineRepository, prescriptionRepository, prescriptionDetailRepository);
        when(medicalRecord.getAppointment()).thenReturn(appointment);
        when(appointment.getDoctor()).thenReturn(doctor);
        when(doctor.getUser()).thenReturn(doctorUser);
        when(doctorUser.getId()).thenReturn(2L);
    }

    @Test
    void createPrescription_savesPrescriptionAndDetails() {
        when(medicalRecordRepository.findById(10L)).thenReturn(Optional.of(medicalRecord));
        when(prescriptionRepository.existsByMedicalRecord_Id(10L)).thenReturn(false);
        when(medicineRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(medicine));
        when(medicine.getId()).thenReturn(1L);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> {
            Prescription value = invocation.getArgument(0);
            ReflectionTestUtils.setField(value, "id", 20L);
            ReflectionTestUtils.setField(value, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
            return value;
        });
        when(prescriptionDetailRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PrescriptionResponse response = service.createPrescription(2L, 10L, request());

        assertEquals(20L, response.prescriptionId());
        assertEquals(1, response.details().size());
    }

    @Test
    void createPrescription_rejectsOtherDoctorsRecord() {
        when(medicalRecordRepository.findById(10L)).thenReturn(Optional.of(medicalRecord));
        when(doctorUser.getId()).thenReturn(9L);
        assertThrows(DoctorAppointmentAccessDeniedException.class, () -> service.createPrescription(2L, 10L, request()));
    }

    @Test
    void createPrescription_rejectsDuplicate() {
        when(medicalRecordRepository.findById(10L)).thenReturn(Optional.of(medicalRecord));
        when(prescriptionRepository.existsByMedicalRecord_Id(10L)).thenReturn(true);
        assertThrows(PrescriptionAlreadyExistsException.class, () -> service.createPrescription(2L, 10L, request()));
    }

    @Test
    void createPrescription_rejectsUnavailableMedicine() {
        when(medicalRecordRepository.findById(10L)).thenReturn(Optional.of(medicalRecord));
        when(prescriptionRepository.existsByMedicalRecord_Id(10L)).thenReturn(false);
        when(medicineRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());
        assertThrows(MedicineNotAvailableException.class, () -> service.createPrescription(2L, 10L, request()));
    }

    private CreatePrescriptionRequest request() {
        return new CreatePrescriptionRequest("After meals", List.of(new CreatePrescriptionDetailRequest(1L, "1 tablet", "twice daily", "5 days", 10, "After meals")));
    }
}
