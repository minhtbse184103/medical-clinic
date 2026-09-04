package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByIdAndActiveTrue(Long medicineId);

    Page<Medicine> findByNameContainingIgnoreCaseAndActive(
            String name,
            boolean active,
            Pageable pageable
    );
}
