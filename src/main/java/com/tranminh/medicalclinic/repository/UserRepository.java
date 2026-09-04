package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("select user from User user where user.role in :staffRoles and (:role is null or user.role = :role) and (:status is null or user.status = :status)")
    Page<User> findStaff(
            @Param("staffRoles") java.util.Collection<com.tranminh.medicalclinic.enums.Role> staffRoles,
            @Param("role") com.tranminh.medicalclinic.enums.Role role,
            @Param("status") com.tranminh.medicalclinic.enums.UserStatus status,
            Pageable pageable
    );
}
