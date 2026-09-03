package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByAppointment_Id(Long appointmentId);

    boolean existsByAppointment_Id(Long appointmentId);
}
