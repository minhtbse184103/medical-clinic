package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PatientPrescriptionDetailResponse;
import com.tranminh.medicalclinic.dto.response.PatientPrescriptionPageResponse;
import com.tranminh.medicalclinic.dto.response.PatientPrescriptionResponse;
import com.tranminh.medicalclinic.entity.Prescription;
import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.PrescriptionDetailRepository;
import com.tranminh.medicalclinic.repository.PrescriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PatientPrescriptionQueryService {

    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;

    public PatientPrescriptionQueryService(
            PatientRepository patientRepository,
            PrescriptionRepository prescriptionRepository,
            PrescriptionDetailRepository prescriptionDetailRepository
    ) {
        this.patientRepository = patientRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionDetailRepository = prescriptionDetailRepository;
    }

    @Transactional(readOnly = true)
    public PatientPrescriptionPageResponse getMyPrescriptions(Long userId, int page, int size) {
        Long patientId = patientRepository.findByUser_Id(userId)
                .orElseThrow(() -> new PatientProfileNotFoundException(userId))
                .getId();
        Page<Prescription> prescriptions = prescriptionRepository.findByPatientId(
                patientId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        List<Long> prescriptionIds = prescriptions.getContent().stream().map(Prescription::getId).toList();
        List<PrescriptionDetail> details = prescriptionIds.isEmpty()
                ? List.of()
                : prescriptionDetailRepository.findByPrescriptionIdsWithMedicine(prescriptionIds);
        Map<Long, List<PrescriptionDetail>> detailsByPrescriptionId = details
                .stream()
                .collect(Collectors.groupingBy(detail -> detail.getPrescription().getId()));

        return new PatientPrescriptionPageResponse(
                prescriptions.getContent().stream().map(prescription -> toResponse(
                        prescription,
                        detailsByPrescriptionId.getOrDefault(prescription.getId(), List.of())
                )).toList(),
                prescriptions.getNumber(),
                prescriptions.getSize(),
                prescriptions.getTotalElements(),
                prescriptions.getTotalPages()
        );
    }

    private PatientPrescriptionResponse toResponse(Prescription prescription, List<PrescriptionDetail> details) {
        return new PatientPrescriptionResponse(
                prescription.getId(),
                prescription.getMedicalRecord().getId(),
                prescription.getMedicalRecord().getAppointment().getId(),
                prescription.getNotes(),
                details.stream().map(detail -> new PatientPrescriptionDetailResponse(
                        detail.getMedicine().getId(), detail.getMedicine().getName(), detail.getDosage(),
                        detail.getFrequency(), detail.getDuration(), detail.getQuantity(), detail.getInstruction()
                )).toList(),
                prescription.getCreatedAt()
        );
    }
}
