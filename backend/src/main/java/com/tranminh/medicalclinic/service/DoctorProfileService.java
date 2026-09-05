package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.UpdateDoctorProfileRequest;
import com.tranminh.medicalclinic.dto.response.DoctorProfileResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorProfileService {

    private final DoctorRepository doctorRepository;

    public DoctorProfileService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    public DoctorProfileResponse getOwnProfile(Long userId) {
        return toResponse(getDoctorByUserId(userId));
    }

    @Transactional
    public DoctorProfileResponse updateOwnProfile(Long userId, UpdateDoctorProfileRequest request) {
        Doctor doctor = getDoctorByUserId(userId);
        doctor.updateProfile(request.fullName(), request.phone(), request.bio());

        return toResponse(doctorRepository.saveAndFlush(doctor));
    }

    /** The Doctor is resolved from the authenticated user id, never from a client parameter. */
    private Doctor getDoctorByUserId(Long userId) {
        return doctorRepository.findByUser_Id(userId)
                .orElseThrow(() -> new DoctorProfileNotFoundException(userId));
    }

    private DoctorProfileResponse toResponse(Doctor doctor) {
        return new DoctorProfileResponse(
                doctor.getId(),
                doctor.getUser().getId(),
                doctor.getUser().getEmail(),
                doctor.getFullName(),
                doctor.getPhone(),
                doctor.getSpecialty(),
                doctor.getLicenseNumber(),
                doctor.getBio(),
                doctor.getUser().getStatus(),
                doctor.getCreatedAt(),
                doctor.getUpdatedAt()
        );
    }
}
