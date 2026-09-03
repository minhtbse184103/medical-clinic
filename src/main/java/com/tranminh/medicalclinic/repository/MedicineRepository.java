package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Page<Medicine> findByNameContainingIgnoreCaseAndActive(
            String name,
            boolean active,
            Pageable pageable
    );
}
