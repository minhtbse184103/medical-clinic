package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionDetailRepository extends JpaRepository<PrescriptionDetail, Long> {

    List<PrescriptionDetail> findByPrescription_IdOrderById(Long prescriptionId);
}
