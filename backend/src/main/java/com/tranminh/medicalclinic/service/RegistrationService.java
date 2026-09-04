package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.RegisterPatientRequest;
import com.tranminh.medicalclinic.dto.response.RegisterPatientResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterPatientResponse registerPatient(RegisterPatientRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                Role.PATIENT
        );
        User savedUser = userRepository.save(user);

        Patient patient = new Patient(
                savedUser,
                request.fullName(),
                request.phone(),
                request.dateOfBirth(),
                request.gender(),
                request.address()
        );
        Patient savedPatient = patientRepository.save(patient);

        return new RegisterPatientResponse(
                savedUser.getId(),
                savedPatient.getId(),
                savedUser.getEmail(),
                savedPatient.getFullName(),
                savedPatient.getPhone(),
                savedPatient.getDateOfBirth(),
                savedPatient.getGender(),
                savedPatient.getAddress(),
                savedUser.getStatus(),
                savedUser.getCreatedAt()
        );
    }
}
