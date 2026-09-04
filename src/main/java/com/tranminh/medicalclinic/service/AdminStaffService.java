package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateReceptionistRequest;
import com.tranminh.medicalclinic.dto.response.StaffPageResponse;
import com.tranminh.medicalclinic.dto.response.StaffResponse;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.exception.StaffNotFoundException;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminStaffService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public StaffResponse createReceptionist(CreateReceptionistRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        return toResponse(userRepository.save(new User(
                request.email(), passwordEncoder.encode(request.temporaryPassword()), Role.RECEPTIONIST
        )));
    }

    @Transactional(readOnly = true)
    public StaffPageResponse getStaff(Role role, UserStatus status, int page, int size) {
        Page<User> staff = userRepository.findStaff(
                java.util.List.of(Role.DOCTOR, Role.RECEPTIONIST),
                role,
                status,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return new StaffPageResponse(staff.getContent().stream().map(this::toResponse).toList(), staff.getNumber(), staff.getSize(), staff.getTotalElements(), staff.getTotalPages());
    }

    @Transactional
    public StaffResponse activate(Long userId) {
        return changeStatus(userId, UserStatus.ACTIVE);
    }

    @Transactional
    public StaffResponse deactivate(Long userId) {
        return changeStatus(userId, UserStatus.INACTIVE);
    }

    private StaffResponse changeStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new StaffNotFoundException(userId));
        if (user.getRole() != Role.DOCTOR && user.getRole() != Role.RECEPTIONIST) {
            throw new StaffNotFoundException(userId);
        }
        user.changeStatus(status);
        return toResponse(user);
    }

    private StaffResponse toResponse(User user) {
        return new StaffResponse(user.getId(), user.getEmail(), user.getRole(), user.getStatus(), user.getCreatedAt());
    }
}
