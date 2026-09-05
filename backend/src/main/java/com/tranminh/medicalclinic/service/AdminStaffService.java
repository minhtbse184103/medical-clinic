package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateReceptionistRequest;
import com.tranminh.medicalclinic.dto.response.StaffPageResponse;
import com.tranminh.medicalclinic.dto.response.StaffResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.EmailAlreadyExistsException;
import com.tranminh.medicalclinic.exception.StaffNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
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
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffService(
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public StaffResponse createReceptionist(CreateReceptionistRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        return toResponse(userRepository.save(new User(
                request.email(), passwordEncoder.encode(request.temporaryPassword()), Role.RECEPTIONIST
        )), null);
    }

    @Transactional(readOnly = true)
    public StaffPageResponse getStaff(Role role, UserStatus status, int page, int size) {
        Page<User> staff = userRepository.findStaff(
                java.util.List.of(Role.DOCTOR, Role.RECEPTIONIST),
                role,
                status,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        // One lookup for the whole page rather than one per doctor row.
        java.util.List<Long> doctorUserIds = staff.getContent().stream()
                .filter(user -> user.getRole() == Role.DOCTOR)
                .map(User::getId)
                .toList();
        java.util.Map<Long, Doctor> profiles = doctorUserIds.isEmpty()
                ? java.util.Map.of()
                : doctorRepository.findByUser_IdIn(doctorUserIds).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                doctor -> doctor.getUser().getId(), doctor -> doctor));

        return new StaffPageResponse(
                staff.getContent().stream()
                        .map(user -> toResponse(user, profiles.get(user.getId())))
                        .toList(),
                staff.getNumber(), staff.getSize(), staff.getTotalElements(), staff.getTotalPages());
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
        return toResponse(
                user,
                user.getRole() == Role.DOCTOR
                        ? doctorRepository.findByUser_Id(userId).orElse(null)
                        : null);
    }

    /** {@code doctor} is null for a RECEPTIONIST, which has no profile in the MVP. */
    private StaffResponse toResponse(User user, Doctor doctor) {
        return new StaffResponse(
                user.getId(), user.getEmail(), user.getRole(), user.getStatus(), user.getCreatedAt(),
                doctor == null ? null : doctor.getFullName(),
                doctor == null ? null : doctor.getSpecialty(),
                doctor == null ? null : doctor.getLicenseNumber());
    }
}
