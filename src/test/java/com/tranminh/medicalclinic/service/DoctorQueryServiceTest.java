package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorQueryServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorQueryService doctorQueryService;

    @Test
    void getDoctors_normalizesFiltersAndReturnsPublicDoctorData() {
        Doctor doctor = createDoctor(5L);
        PageRequest pageRequest = PageRequest.of(0, 20);
        when(doctorRepository.searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                eq("Cardiology"),
                eq("tran"),
                any(PageRequest.class)
        )).thenReturn(new PageImpl<>(List.of(doctor), pageRequest, 1));

        DoctorPageResponse response = doctorQueryService.getDoctors(
                0,
                20,
                "  Cardiology  ",
                " tran "
        );

        assertEquals(1, response.totalElements());
        assertEquals(5L, response.content().getFirst().doctorId());
        assertEquals("Dr. Tran B", response.content().getFirst().fullName());
        assertEquals("Cardiology", response.content().getFirst().specialty());
        verify(doctorRepository).searchByActiveStatus(
                eq(UserStatus.ACTIVE),
                eq("Cardiology"),
                eq("tran"),
                any(PageRequest.class)
        );
    }

    @Test
    void getDoctor_returnsActiveDoctorOnly() {
        Doctor doctor = createDoctor(5L);
        when(doctorRepository.findByIdAndUser_Status(5L, UserStatus.ACTIVE))
                .thenReturn(Optional.of(doctor));

        DoctorResponse response = doctorQueryService.getDoctor(5L);

        assertEquals(5L, response.doctorId());
        assertEquals("Dr. Tran B", response.fullName());
        verify(doctorRepository).findByIdAndUser_Status(5L, UserStatus.ACTIVE);
    }

    @Test
    void getDoctor_throwsNotFoundWhenDoctorIsMissingOrInactive() {
        when(doctorRepository.findByIdAndUser_Status(5L, UserStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(DoctorNotFoundException.class, () -> doctorQueryService.getDoctor(5L));
    }

    private Doctor createDoctor(Long doctorId) {
        Doctor doctor = new Doctor(
                new User("doctor@example.com", "password-hash", Role.DOCTOR),
                "Dr. Tran B",
                "0900000000",
                "Cardiology",
                "VN-DOC-001",
                "Specializes in cardiovascular care."
        );
        ReflectionTestUtils.setField(doctor, "id", doctorId);
        return doctor;
    }
}
