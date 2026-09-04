package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.PrescriptionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionDetailRepository extends JpaRepository<PrescriptionDetail, Long> {

    List<PrescriptionDetail> findByPrescription_IdOrderById(Long prescriptionId);

    @Query("select detail from PrescriptionDetail detail join fetch detail.medicine where detail.prescription.id in :prescriptionIds order by detail.prescription.id, detail.id")
    List<PrescriptionDetail> findByPrescriptionIdsWithMedicine(@Param("prescriptionIds") List<Long> prescriptionIds);
}
