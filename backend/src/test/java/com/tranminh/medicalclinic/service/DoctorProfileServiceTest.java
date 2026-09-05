package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.UpdateDoctorProfileRequest;
import com.tranminh.medicalclinic.dto.response.DoctorProfileResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorProfileServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorProfileService doctorProfileService;

    @Test
    void getOwnProfile_returnsEmailAndLicenceBecauseTheyBelongToTheDoctorReadingThem() {
        when(doctorRepository.findByUser_Id(7L)).thenReturn(Optional.of(createDoctor()));

        DoctorProfileResponse response = doctorProfileService.getOwnProfile(7L);

        assertEquals(3L, response.doctorId());
        assertEquals(7L, response.userId());
        assertEquals("doctor1@clinic.local", response.email());
        assertEquals("Nguyen Van An", response.fullName());
        assertEquals("LIC-DEMO-0001", response.licenseNumber());
        assertEquals(UserStatus.ACTIVE, response.status());
    }

    @Test
    void updateOwnProfile_updatesOnlyTheFieldsADoctorMayMaintain() {
        Doctor doctor = createDoctor();
        when(doctorRepository.findByUser_Id(7L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.saveAndFlush(any(Doctor.class))).thenAnswer(call -> call.getArgument(0));

        DoctorProfileResponse response = doctorProfileService.updateOwnProfile(
                7L,
                new UpdateDoctorProfileRequest("Nguyen Van An Updated", "0911111111", "Bio moi")
        );

        assertEquals("Nguyen Van An Updated", response.fullName());
        assertEquals("0911111111", response.phone());
        assertEquals("Bio moi", response.bio());

        // Practising credentials stay under ADMIN control and must survive the update.
        assertEquals("Nội tổng quát", response.specialty());
        assertEquals("LIC-DEMO-0001", response.licenseNumber());
        assertEquals("doctor1@clinic.local", response.email());
    }

    @Test
    void updateOwnProfile_clearsOptionalFieldsWhenOmitted() {
        Doctor doctor = createDoctor();
        when(doctorRepository.findByUser_Id(7L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.saveAndFlush(any(Doctor.class))).thenAnswer(call -> call.getArgument(0));

        DoctorProfileResponse response = doctorProfileService.updateOwnProfile(
                7L,
                new UpdateDoctorProfileRequest("Nguyen Van An", null, null)
        );

        assertEquals(null, response.phone());
        assertEquals(null, response.bio());
    }

    @Test
    void getOwnProfile_throwsWhenTheUserHasNoDoctorProfile() {
        when(doctorRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        assertThrows(
                DoctorProfileNotFoundException.class,
                () -> doctorProfileService.getOwnProfile(99L)
        );
    }

    @Test
    void updateOwnProfile_doesNotTouchTheRepositoryWhenTheProfileIsMissing() {
        when(doctorRepository.findByUser_Id(99L)).thenReturn(Optional.empty());

        assertThrows(
                DoctorProfileNotFoundException.class,
                () -> doctorProfileService.updateOwnProfile(
                        99L,
                        new UpdateDoctorProfileRequest("X", null, null)
                )
        );

        verifyNoMoreInteractions(doctorRepository);
    }

    private Doctor createDoctor() {
        User user = new User("doctor1@clinic.local", "hash", Role.DOCTOR);
        ReflectionTestUtils.setField(user, "id", 7L);

        Doctor doctor = new Doctor(
                user,
                "Nguyen Van An",
                "0900000001",
                "Nội tổng quát",
                "LIC-DEMO-0001",
                "Bac si noi tong quat"
        );
        ReflectionTestUtils.setField(doctor, "id", 3L);
        return doctor;
    }
}
