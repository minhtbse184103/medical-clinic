package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUser_Id(Long userId);

    /** Resolves a page of staff users to their Doctor profiles in one query, not one each. */
    List<Doctor> findByUser_IdIn(Collection<Long> userIds);

    boolean existsByLicenseNumber(String licenseNumber);

    @Query("""
            select d from Doctor d
            where d.user.status = :status
              and (:specialty is null or lower(d.specialty) like lower(concat('%', :specialty, '%')))
              and (:name is null or lower(d.fullName) like lower(concat('%', :name, '%')))
            """)
    Page<Doctor> searchByActiveStatus(
            @Param("status") UserStatus status,
            @Param("specialty") String specialty,
            @Param("name") String name,
            Pageable pageable
    );

    Optional<Doctor> findByIdAndUser_Status(Long id, UserStatus status);
}
