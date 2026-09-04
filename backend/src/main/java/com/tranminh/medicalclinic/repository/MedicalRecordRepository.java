package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByAppointment_Id(Long appointmentId);

    boolean existsByAppointment_Id(Long appointmentId);

    @Query(
            value = "select record from MedicalRecord record join fetch record.appointment appointment where appointment.patient.id = :patientId",
            countQuery = "select count(record) from MedicalRecord record where record.appointment.patient.id = :patientId"
    )
    Page<MedicalRecord> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);
}
