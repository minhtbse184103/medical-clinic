package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.ReceptionistPatientPageResponse;
import com.tranminh.medicalclinic.dto.response.ReceptionistPatientResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReceptionistPatientQueryService {

    private final PatientRepository patientRepository;

    public ReceptionistPatientQueryService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    /**
     * Only ACTIVE Patients are returned, because booking rejects an inactive account.
     * Returning them would let a Receptionist pick someone the booking would then refuse.
     */
    @Transactional(readOnly = true)
    public ReceptionistPatientPageResponse searchPatients(int page, int size, String name, String phone) {
        Page<Patient> patients = patientRepository.searchByActiveStatus(
                UserStatus.ACTIVE,
                normalizeFilter(name),
                normalizeFilter(phone),
                PageRequest.of(page, size)
        );

        return new ReceptionistPatientPageResponse(
                patients.getContent().stream().map(this::toResponse).toList(),
                patients.getNumber(),
                patients.getSize(),
                patients.getTotalElements(),
                patients.getTotalPages()
        );
    }

    private String normalizeFilter(String filter) {
        if (filter == null || filter.isBlank()) {
            return null;
        }
        return filter.strip();
    }

    private ReceptionistPatientResponse toResponse(Patient patient) {
        return new ReceptionistPatientResponse(
                patient.getId(),
                patient.getFullName(),
                patient.getPhone(),
                patient.getDateOfBirth(),
                patient.getGender()
        );
    }
}
