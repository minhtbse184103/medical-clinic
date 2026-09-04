package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.dto.response.PatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.exception.InvalidMedicalRecordSortException;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientMedicalRecordQueryService {
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    public PatientMedicalRecordQueryService(PatientRepository patientRepository, MedicalRecordRepository medicalRecordRepository) { this.patientRepository = patientRepository; this.medicalRecordRepository = medicalRecordRepository; }

    @Transactional(readOnly = true)
    public PatientMedicalRecordPageResponse getMyRecords(Long userId, int page, int size, String sort) {
        Sort pageableSort = toSort(sort);
        Long patientId = patientRepository.findByUser_Id(userId).orElseThrow(() -> new PatientProfileNotFoundException(userId)).getId();
        Page<MedicalRecord> records = medicalRecordRepository.findByPatientId(patientId, PageRequest.of(page, size, pageableSort));
        return new PatientMedicalRecordPageResponse(records.getContent().stream().map(this::toResponse).toList(), records.getNumber(), records.getSize(), records.getTotalElements(), records.getTotalPages());
    }
    private Sort toSort(String sort) {
        String[] parts = sort.split(",", -1);
        if (parts.length != 2 || !"createdAt".equals(parts[0])) throw new InvalidMedicalRecordSortException();
        try { return Sort.by(Sort.Direction.fromString(parts[1]), "createdAt"); }
        catch (IllegalArgumentException exception) { throw new InvalidMedicalRecordSortException(); }
    }
    private MedicalRecordResponse toResponse(MedicalRecord record) { return new MedicalRecordResponse(record.getId(), record.getAppointment().getId(), record.getSymptoms(), record.getDiagnosis(), record.getTreatment(), record.getNotes(), record.getCreatedAt()); }
}
