package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByMedicalRecord_Id(Long medicalRecordId);

    boolean existsByMedicalRecord_Id(Long medicalRecordId);
}
