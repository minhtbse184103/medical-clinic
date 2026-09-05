package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.CurrentUserResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.UserNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private CurrentUserService currentUserService;

    @Test
    void getCurrentUser_returnsFullNameFromPatientProfile() {
        User user = userWithId(1L, "patient@example.com", Role.PATIENT);
        Patient patient = new Patient(user, "Nguyen Van A", "0901234567", null, null, null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(patientRepository.findByUser_Id(1L)).thenReturn(Optional.of(patient));

        CurrentUserResponse response = currentUserService.getCurrentUser(1L);

        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.email()).isEqualTo("patient@example.com");
        assertThat(response.role()).isEqualTo(Role.PATIENT);
        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(response.fullName()).isEqualTo("Nguyen Van A");
        verifyNoInteractions(doctorRepository);
    }

    @Test
    void getCurrentUser_returnsFullNameFromDoctorProfile() {
        User user = userWithId(2L, "doctor@example.com", Role.DOCTOR);
        Doctor doctor = new Doctor(user, "Tran Thi B", "0902222222", "Nhi khoa", "LIC-001", null);

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.of(doctor));

        CurrentUserResponse response = currentUserService.getCurrentUser(2L);

        assertThat(response.role()).isEqualTo(Role.DOCTOR);
        assertThat(response.fullName()).isEqualTo("Tran Thi B");
        verifyNoInteractions(patientRepository);
    }

    @Test
    void getCurrentUser_returnsNullFullNameForRolesWithoutProfileTable() {
        User user = userWithId(3L, "receptionist@example.com", Role.RECEPTIONIST);

        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        CurrentUserResponse response = currentUserService.getCurrentUser(3L);

        assertThat(response.role()).isEqualTo(Role.RECEPTIONIST);
        assertThat(response.fullName()).isNull();
        verifyNoInteractions(patientRepository, doctorRepository);
    }

    @Test
    void getCurrentUser_throwsWhenUserNoLongerExists() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> currentUserService.getCurrentUser(99L))
                .isInstanceOf(UserNotFoundException.class);
    }

    private User userWithId(Long id, String email, Role role) {
        User user = new User(email, "hash", role);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
