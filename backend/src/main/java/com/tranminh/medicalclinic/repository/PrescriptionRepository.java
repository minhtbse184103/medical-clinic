package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByMedicalRecord_Id(Long medicalRecordId);

    boolean existsByMedicalRecord_Id(Long medicalRecordId);

    @Query(
            value = "select prescription from Prescription prescription join fetch prescription.medicalRecord medicalRecord join fetch medicalRecord.appointment appointment where appointment.patient.id = :patientId",
            countQuery = "select count(prescription) from Prescription prescription where prescription.medicalRecord.appointment.patient.id = :patientId"
    )
    Page<Prescription> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);
}
