package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateReceptionistRequest;
import com.tranminh.medicalclinic.dto.response.StaffPageResponse;
import com.tranminh.medicalclinic.dto.response.StaffResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminStaffServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @Test
    void createReceptionist_createsActiveReceptionistUser() {
        when(userRepository.existsByEmail("receptionist@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Temp123!" )).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 3L);
            return user;
        });
        AdminStaffService service = new AdminStaffService(userRepository, doctorRepository, passwordEncoder);

        StaffResponse response = service.createReceptionist(new CreateReceptionistRequest("receptionist@example.com", "Temp123!"));

        assertEquals(Role.RECEPTIONIST, response.role());
        assertEquals(UserStatus.ACTIVE, response.status());
    }

    @Test
    void deactivate_changesOnlyStaffAccountStatus() {
        User receptionist = new User("receptionist@example.com", "hash", Role.RECEPTIONIST);
        ReflectionTestUtils.setField(receptionist, "id", 3L);
        when(userRepository.findById(3L)).thenReturn(Optional.of(receptionist));
        AdminStaffService service = new AdminStaffService(userRepository, doctorRepository, passwordEncoder);

        assertEquals(UserStatus.INACTIVE, service.deactivate(3L).status());
    }

    @Test
    void getStaff_fillsDoctorProfileFieldsAndLeavesReceptionistOnesNull() {
        User doctorUser = new User("doctor@example.com", "hash", Role.DOCTOR);
        ReflectionTestUtils.setField(doctorUser, "id", 4L);
        User receptionistUser = new User("receptionist@example.com", "hash", Role.RECEPTIONIST);
        ReflectionTestUtils.setField(receptionistUser, "id", 5L);
        when(userRepository.findStaff(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(doctorUser, receptionistUser)));
        when(doctorRepository.findByUser_IdIn(List.of(4L)))
                .thenReturn(List.of(new Doctor(doctorUser, "Tran Minh", "0900", "Tim mach", "LIC-1", null)));
        AdminStaffService service = new AdminStaffService(userRepository, doctorRepository, passwordEncoder);

        StaffPageResponse page = service.getStaff(null, null, 0, 20);

        assertEquals("Tran Minh", page.content().get(0).fullName());
        assertEquals("Tim mach", page.content().get(0).specialty());
        assertEquals("LIC-1", page.content().get(0).licenseNumber());
        assertNull(page.content().get(1).fullName());
        assertNull(page.content().get(1).specialty());
    }
}
