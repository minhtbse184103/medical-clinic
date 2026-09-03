package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.UpdatePatientProfileRequest;
import com.tranminh.medicalclinic.dto.response.PatientProfileResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientProfileServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private PatientProfileService patientProfileService;

    @Test
    void getOwnProfile_returnsMappedProfile() {
        Long userId = 1L;
        Patient patient = createPatient();
        when(patientRepository.findByUser_Id(userId)).thenReturn(Optional.of(patient));

        PatientProfileResponse response = patientProfileService.getOwnProfile(userId);

        assertEquals("patient@example.com", response.email());
        assertEquals("Nguyen Van A", response.fullName());
        assertEquals(Gender.MALE, response.gender());
    }

    @Test
    void updateOwnProfile_updatesProfileAndReturnsResponse() {
        Long userId = 1L;
        Patient patient = createPatient();
        UpdatePatientProfileRequest request = new UpdatePatientProfileRequest(
                "Nguyen Van B",
                "0909999999",
                LocalDate.of(2001, 1, 15),
                Gender.OTHER,
                "Da Nang"
        );
        when(patientRepository.findByUser_Id(userId)).thenReturn(Optional.of(patient));
        when(patientRepository.saveAndFlush(patient)).thenReturn(patient);

        PatientProfileResponse response = patientProfileService.updateOwnProfile(userId, request);

        assertEquals("Nguyen Van B", response.fullName());
        assertEquals("0909999999", response.phone());
        assertEquals(Gender.OTHER, response.gender());
        verify(patientRepository).saveAndFlush(patient);
    }

    @Test
    void getOwnProfile_throwsExceptionWhenProfileDoesNotExist() {
        Long userId = 1L;
        when(patientRepository.findByUser_Id(userId)).thenReturn(Optional.empty());

        assertThrows(
                PatientProfileNotFoundException.class,
                () -> patientProfileService.getOwnProfile(userId)
        );
    }

    private Patient createPatient() {
        User user = new User("patient@example.com", "password-hash", Role.PATIENT);
        return new Patient(
                user,
                "Nguyen Van A",
                "0901234567",
                LocalDate.of(2000, 5, 10),
                Gender.MALE,
                "Ho Chi Minh City"
        );
    }
}
