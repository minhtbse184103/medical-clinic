package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUser_Id(Long userId);

    @Query("""
            select p from Patient p
            where p.user.status = :status
              and (:name is null or lower(p.fullName) like lower(concat('%', :name, '%')))
              and (:phone is null or p.phone like concat('%', :phone, '%'))
            order by p.fullName asc
            """)
    Page<Patient> searchByActiveStatus(
            @Param("status") UserStatus status,
            @Param("name") String name,
            @Param("phone") String phone,
            Pageable pageable
    );
}
