package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PrescriptionMedicineResponse;
import com.tranminh.medicalclinic.dto.response.PrescriptionViewResponse;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.exception.PrescriptionAccessDeniedException;
import com.tranminh.medicalclinic.exception.PrescriptionNotFoundException;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrescriptionQueryService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;

    public PrescriptionQueryService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionDetailRepository prescriptionDetailRepository
    ) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionDetailRepository = prescriptionDetailRepository;
    }

    @Transactional(readOnly = true)
    public PrescriptionViewResponse getPrescription(
            Long authenticatedUserId,
            boolean isDoctor,
            Long medicalRecordId
    ) {
        Prescription prescription = prescriptionRepository.findByMedicalRecord_Id(medicalRecordId)
                .orElseThrow(() -> new PrescriptionNotFoundException(medicalRecordId));
        Long ownerUserId = isDoctor
                ? prescription.getMedicalRecord().getAppointment().getDoctor().getUser().getId()
                : prescription.getMedicalRecord().getAppointment().getPatient().getUser().getId();
        if (!ownerUserId.equals(authenticatedUserId)) {
            throw new PrescriptionAccessDeniedException();
        }

        return new PrescriptionViewResponse(
                prescription.getId(),
                medicalRecordId,
                prescription.getMedicalRecord().getAppointment().getId(),
                prescription.getNotes(),
                prescriptionDetailRepository.findByPrescriptionIdsWithMedicine(java.util.List.of(prescription.getId()))
                        .stream()
                        .map(detail -> new PrescriptionMedicineResponse(
                                detail.getMedicine().getId(), detail.getMedicine().getName(), detail.getDosage(),
                                detail.getFrequency(), detail.getDuration(), detail.getQuantity(), detail.getInstruction()
                        ))
                        .toList(),
                prescription.getCreatedAt()
        );
    }
}
