package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUser_Id(Long userId);

    boolean existsByLicenseNumber(String licenseNumber);
}
