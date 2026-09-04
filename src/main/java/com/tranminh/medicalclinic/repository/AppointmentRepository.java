package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
            select appointment from Appointment appointment
            join fetch appointment.doctor doctor
            where appointment.patient.id = :patientId
              and (:status is null or appointment.status = :status)
              and (:fromDate is null or appointment.appointmentDate >= :fromDate)
              and (:toDate is null or appointment.appointmentDate <= :toDate)
            """)
    Page<Appointment> findPatientAppointments(
            @Param("patientId") Long patientId,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query(value = """
            select appointment from Appointment appointment
            join fetch appointment.patient patient
            where appointment.doctor.id = :doctorId
              and (:date is null or appointment.appointmentDate = :date)
              and (:status is null or appointment.status = :status)
            """, countQuery = """
            select count(appointment) from Appointment appointment
            where appointment.doctor.id = :doctorId
              and (:date is null or appointment.appointmentDate = :date)
              and (:status is null or appointment.status = :status)
            """)
    Page<Appointment> findDoctorAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("status") AppointmentStatus status,
            Pageable pageable
    );

    @Query(value = """
            select appointment from Appointment appointment
            join fetch appointment.patient patient
            join fetch appointment.doctor doctor
            where (:date is null or appointment.appointmentDate = :date)
              and (:doctorId is null or doctor.id = :doctorId)
              and (:patientId is null or patient.id = :patientId)
              and (:status is null or appointment.status = :status)
            """, countQuery = """
            select count(appointment) from Appointment appointment
            where (:date is null or appointment.appointmentDate = :date)
              and (:doctorId is null or appointment.doctor.id = :doctorId)
              and (:patientId is null or appointment.patient.id = :patientId)
              and (:status is null or appointment.status = :status)
            """)
    Page<Appointment> findReceptionistAppointments(
            @Param("date") LocalDate date,
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("status") AppointmentStatus status,
            Pageable pageable
    );

    List<Appointment> findByDoctor_IdAndAppointmentDateOrderByStartTime(
            Long doctorId,
            LocalDate appointmentDate
    );

    List<Appointment> findByDoctor_IdAndAppointmentDateAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            Collection<AppointmentStatus> statuses
    );

    List<Appointment> findByDoctor_IdAndAppointmentDateGreaterThanEqualAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            Collection<AppointmentStatus> statuses
    );

    boolean existsByDoctor_IdAndAppointmentDateAndStartTimeAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime startTime,
            Collection<AppointmentStatus> statuses
    );

    boolean existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(
            Long patientId,
            LocalDate appointmentDate,
            LocalTime startTime,
            Collection<AppointmentStatus> statuses
    );

    boolean existsByDoctor_IdAndPatient_Id(Long doctorId, Long patientId);
}
