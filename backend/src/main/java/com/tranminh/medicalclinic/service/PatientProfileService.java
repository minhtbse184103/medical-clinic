package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.UpdatePatientProfileRequest;
import com.tranminh.medicalclinic.dto.response.PatientProfileResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientProfileService {

    private final PatientRepository patientRepository;

    public PatientProfileService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getOwnProfile(Long userId) {
        Patient patient = getPatientByUserId(userId);
        return toResponse(patient);
    }

    @Transactional
    public PatientProfileResponse updateOwnProfile(Long userId, UpdatePatientProfileRequest request) {
        Patient patient = getPatientByUserId(userId);
        patient.updateProfile(
                request.fullName(),
                request.phone(),
                request.dateOfBirth(),
                request.gender(),
                request.address()
        );

        Patient updatedPatient = patientRepository.saveAndFlush(patient);
        return toResponse(updatedPatient);
    }

    private Patient getPatientByUserId(Long userId) {
        return patientRepository.findByUser_Id(userId)
                .orElseThrow(() -> new PatientProfileNotFoundException(userId));
    }

    private PatientProfileResponse toResponse(Patient patient) {
        return new PatientProfileResponse(
                patient.getId(),
                patient.getUser().getId(),
                patient.getUser().getEmail(),
                patient.getFullName(),
                patient.getPhone(),
                patient.getDateOfBirth(),
                patient.getGender(),
                patient.getAddress(),
                patient.getUser().getStatus(),
                patient.getCreatedAt(),
                patient.getUpdatedAt()
        );
    }
}
