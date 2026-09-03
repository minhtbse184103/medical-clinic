package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.RegisterPatientRequest;
import com.tranminh.medicalclinic.dto.response.RegisterPatientResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegistrationService registrationService;

    @Test
    void registerPatient_hashesPasswordAndCreatesUserAndPatient() {
        RegisterPatientRequest request = createRequest();
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterPatientResponse response = registrationService.registerPatient(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(userRepository).save(userCaptor.capture());
        verify(patientRepository).save(patientCaptor.capture());
        verify(passwordEncoder).encode(request.password());

        assertEquals(request.email(), userCaptor.getValue().getEmail());
        assertEquals(Role.PATIENT, userCaptor.getValue().getRole());
        assertEquals(userCaptor.getValue(), patientCaptor.getValue().getUser());
        assertEquals(request.email(), response.email());
        assertEquals(request.fullName(), response.fullName());
    }

    @Test
    void registerPatient_throwsExceptionWhenEmailAlreadyExists() {
        RegisterPatientRequest request = createRequest();
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThrows(
                EmailAlreadyExistsException.class,
                () -> registrationService.registerPatient(request)
        );

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
        verify(patientRepository, never()).save(any());
    }

    private RegisterPatientRequest createRequest() {
        return new RegisterPatientRequest(
                "patient@example.com",
                "Password123!",
                "Nguyen Van A",
                "0901234567",
                LocalDate.of(2000, 5, 10),
                Gender.MALE,
                "Ho Chi Minh City"
        );
    }
}
