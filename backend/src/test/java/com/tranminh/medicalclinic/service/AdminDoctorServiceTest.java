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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDoctorServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminDoctorService adminDoctorService;

    @Test
    void createDoctor_hashesPasswordAndCreatesUserAndDoctor() {
        CreateDoctorRequest request = createRequest();
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(doctorRepository.existsByLicenseNumber(request.licenseNumber())).thenReturn(false);
        when(passwordEncoder.encode(request.temporaryPassword())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateDoctorResponse response = adminDoctorService.createDoctor(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<Doctor> doctorCaptor = ArgumentCaptor.forClass(Doctor.class);
        verify(userRepository).save(userCaptor.capture());
        verify(doctorRepository).save(doctorCaptor.capture());
        verify(passwordEncoder).encode(request.temporaryPassword());

        assertEquals(Role.DOCTOR, userCaptor.getValue().getRole());
        assertEquals(request.email(), userCaptor.getValue().getEmail());
        assertEquals(userCaptor.getValue(), doctorCaptor.getValue().getUser());
        assertEquals(request.licenseNumber(), doctorCaptor.getValue().getLicenseNumber());
        assertEquals(request.email(), response.email());
        assertEquals(request.fullName(), response.fullName());
    }

    @Test
    void createDoctor_throwsExceptionWhenEmailAlreadyExists() {
        CreateDoctorRequest request = createRequest();
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> adminDoctorService.createDoctor(request));

        verify(doctorRepository, never()).existsByLicenseNumber(any());
        verify(userRepository, never()).save(any());
        verify(doctorRepository, never()).save(any());
    }

    @Test
    void createDoctor_throwsExceptionWhenLicenseNumberAlreadyExists() {
        CreateDoctorRequest request = createRequest();
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(doctorRepository.existsByLicenseNumber(request.licenseNumber())).thenReturn(true);

        assertThrows(DoctorLicenseNumberAlreadyExistsException.class, () -> adminDoctorService.createDoctor(request));

        verify(userRepository, never()).save(any());
        verify(doctorRepository, never()).save(any());
    }

    private CreateDoctorRequest createRequest() {
        return new CreateDoctorRequest(
                "doctor@example.com",
                "Temp123!",
                "Dr. Tran B",
                "0900000000",
                "Internal Medicine",
                "VN-DOC-001",
                "Doctor biography"
        );
    }
}
