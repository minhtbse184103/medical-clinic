package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByIdAndActiveTrue(Long medicineId);

    @Query("select medicine from Medicine medicine where (:name is null or lower(medicine.name) like lower(concat('%', :name, '%'))) and (:active is null or medicine.active = :active)")
    Page<Medicine> search(
            @Param("name") String name,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
