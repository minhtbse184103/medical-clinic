package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.ReceptionistPatientPageResponse;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceptionistPatientQueryServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private ReceptionistPatientQueryService receptionistPatientQueryService;

    @Test
    void searchPatients_normalizesFiltersAndReturnsIdentificationData() {
        Patient patient = createPatient(7L);
        PageRequest pageRequest = PageRequest.of(0, 20);
        when(patientRepository.searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                eq("cuong"),
                eq("0900"),
                any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(patient), pageRequest, 1));

        ReceptionistPatientPageResponse response = receptionistPatientQueryService.searchPatients(
                0,
                20,
                "  cuong  ",
                " 0900 "
        );

        assertEquals(1, response.content().size());
        assertEquals(7L, response.content().getFirst().patientId());
        assertEquals("Le Van Cuong", response.content().getFirst().fullName());
        assertEquals("0900000003", response.content().getFirst().phone());
        assertEquals(LocalDate.of(1995, 5, 20), response.content().getFirst().dateOfBirth());
        assertEquals(Gender.MALE, response.content().getFirst().gender());
        assertEquals(0, response.page());
        assertEquals(1, response.totalElements());
    }

    @Test
    void searchPatients_treatsBlankFiltersAsAbsent() {
        PageRequest pageRequest = PageRequest.of(0, 20);
        when(patientRepository.searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                isNull(),
                isNull(),
                any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(), pageRequest, 0));

        ReceptionistPatientPageResponse response =
                receptionistPatientQueryService.searchPatients(0, 20, "   ", "");

        assertEquals(0, response.totalElements());
        verify(patientRepository).searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                isNull(),
                isNull(),
                any(PageRequest.class)
        );
    }

    @Test
    void searchPatients_onlyQueriesActivePatientsBecauseBookingRejectsInactiveAccounts() {
        PageRequest pageRequest = PageRequest.of(1, 5);
        when(patientRepository.searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                isNull(),
                isNull(),
                any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(), pageRequest, 0));

        receptionistPatientQueryService.searchPatients(1, 5, null, null);

        verify(patientRepository).searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                isNull(),
                isNull(),
                any(PageRequest.class)
        );
    }

    @Test
    void searchPatients_keepsNullableProfileFieldsAsNull() {
        Patient patient = new Patient(activeUser(), "Nguyen Van B", null, null, null, null);
        ReflectionTestUtils.setField(patient, "id", 8L);
        PageRequest pageRequest = PageRequest.of(0, 20);
        when(patientRepository.searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                isNull(),
                isNull(),
                any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(patient), pageRequest, 1));

        ReceptionistPatientPageResponse response =
                receptionistPatientQueryService.searchPatients(0, 20, null, null);

        assertNull(response.content().getFirst().phone());
        assertNull(response.content().getFirst().dateOfBirth());
        assertNull(response.content().getFirst().gender());
    }

    private Patient createPatient(Long id) {
        Patient patient = new Patient(
                activeUser(),
                "Le Van Cuong",
                "0900000003",
                LocalDate.of(1995, 5, 20),
                Gender.MALE,
                "Ha Noi"
        );
        ReflectionTestUtils.setField(patient, "id", id);
        return patient;
    }

    private User activeUser() {
        User user = new User("patient@clinic.local", "hash", Role.PATIENT);
        ReflectionTestUtils.setField(user, "id", 10L);
        return user;
    }
}
