package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreatePrescriptionDetailRequest;
import com.tranminh.medicalclinic.dto.request.CreatePrescriptionRequest;
import com.tranminh.medicalclinic.dto.response.PrescriptionDetailResponse;
import com.tranminh.medicalclinic.dto.response.PrescriptionResponse;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import com.tranminh.medicalclinic.exception.DoctorAppointmentAccessDeniedException;
import com.tranminh.medicalclinic.exception.MedicineNotAvailableException;
import com.tranminh.medicalclinic.exception.PrescriptionAlreadyExistsException;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.MedicineRepository;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PrescriptionService {
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;

    public PrescriptionService(MedicalRecordRepository medicalRecordRepository, MedicineRepository medicineRepository,
                               PrescriptionRepository prescriptionRepository, PrescriptionDetailRepository prescriptionDetailRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.medicineRepository = medicineRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionDetailRepository = prescriptionDetailRepository;
    }

    @Transactional
    public PrescriptionResponse createPrescription(Long doctorUserId, Long medicalRecordId, CreatePrescriptionRequest request) {
        MedicalRecord record = medicalRecordRepository.findById(medicalRecordId)
                .orElseThrow(() -> new IllegalArgumentException("Medical record not found: " + medicalRecordId));
        if (!record.getAppointment().getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new DoctorAppointmentAccessDeniedException();
        }
        if (prescriptionRepository.existsByMedicalRecord_Id(medicalRecordId)) {
            throw new PrescriptionAlreadyExistsException(medicalRecordId);
        }
        Prescription prescription = prescriptionRepository.save(new Prescription(record, request.notes()));
        List<PrescriptionDetail> details = request.items().stream().map(item -> createDetail(prescription, item)).toList();
        List<PrescriptionDetail> savedDetails = prescriptionDetailRepository.saveAll(details);
        return new PrescriptionResponse(prescription.getId(), medicalRecordId, prescription.getNotes(), savedDetails.stream()
                .map(detail -> new PrescriptionDetailResponse(detail.getMedicine().getId(), detail.getDosage(), detail.getFrequency(), detail.getDuration(), detail.getQuantity(), detail.getInstruction())).toList(), prescription.getCreatedAt());
    }

    private PrescriptionDetail createDetail(Prescription prescription, CreatePrescriptionDetailRequest item) {
        Medicine medicine = medicineRepository.findByIdAndActiveTrue(item.medicineId())
                .orElseThrow(() -> new MedicineNotAvailableException(item.medicineId()));
        return new PrescriptionDetail(prescription, medicine, item.dosage(), item.frequency(), item.duration(), item.quantity(), item.instruction());
    }
}
