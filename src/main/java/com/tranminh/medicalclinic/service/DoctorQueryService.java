package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorQueryService {

    private final DoctorRepository doctorRepository;

    public DoctorQueryService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    public DoctorPageResponse getDoctors(int page, int size, String specialty, String name) {
        Page<Doctor> doctors = doctorRepository.searchByActiveStatus(
                UserStatus.ACTIVE,
                normalizeFilter(specialty),
                normalizeFilter(name),
                PageRequest.of(page, size)
        );

        return new DoctorPageResponse(
                doctors.getContent().stream().map(this::toResponse).toList(),
                doctors.getNumber(),
                doctors.getSize(),
                doctors.getTotalElements(),
                doctors.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findByIdAndUser_Status(doctorId, UserStatus.ACTIVE)
                .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        return toResponse(doctor);
    }

    private String normalizeFilter(String filter) {
        if (filter == null || filter.isBlank()) {
            return null;
        }
        return filter.strip();
    }

    private DoctorResponse toResponse(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getFullName(),
                doctor.getPhone(),
                doctor.getSpecialty(),
                doctor.getBio()
        );
    }
}
