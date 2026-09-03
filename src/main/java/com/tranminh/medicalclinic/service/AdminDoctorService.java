package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateDoctorRequest;
import com.tranminh.medicalclinic.dto.response.CreateDoctorResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorLicenseNumberAlreadyExistsException;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDoctorService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDoctorService(
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CreateDoctorResponse createDoctor(CreateDoctorRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        if (doctorRepository.existsByLicenseNumber(request.licenseNumber())) {
            throw new DoctorLicenseNumberAlreadyExistsException(request.licenseNumber());
        }

        User savedUser = userRepository.save(new User(
                request.email(),
                passwordEncoder.encode(request.temporaryPassword()),
                Role.DOCTOR
        ));

        Doctor savedDoctor = doctorRepository.save(new Doctor(
                savedUser,
                request.fullName(),
                request.phone(),
                request.specialty(),
                request.licenseNumber(),
                request.bio()
        ));

        return new CreateDoctorResponse(
                savedUser.getId(),
                savedDoctor.getId(),
                savedUser.getEmail(),
                savedDoctor.getFullName(),
                savedDoctor.getPhone(),
                savedDoctor.getSpecialty(),
                savedDoctor.getLicenseNumber(),
                savedDoctor.getBio(),
                savedUser.getStatus(),
                savedDoctor.getCreatedAt()
        );
    }
}
