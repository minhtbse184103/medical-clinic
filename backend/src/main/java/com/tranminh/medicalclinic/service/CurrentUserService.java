package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.CurrentUserResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.exception.UserNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public CurrentUserService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                resolveFullName(user)
        );
    }

    /**
     * The full name lives on the profile table, so only PATIENT and DOCTOR have one.
     * ADMIN and RECEPTIONIST have no profile table in the MVP; the frontend falls back to the email.
     */
    private String resolveFullName(User user) {
        return switch (user.getRole()) {
            case PATIENT -> patientRepository.findByUser_Id(user.getId())
                    .map(Patient::getFullName)
                    .orElse(null);
            case DOCTOR -> doctorRepository.findByUser_Id(user.getId())
                    .map(Doctor::getFullName)
                    .orElse(null);
            case ADMIN, RECEPTIONIST -> null;
        };
    }
}
