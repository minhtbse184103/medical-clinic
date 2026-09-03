package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctor_IdAndAppointmentDateOrderByStartTime(
            Long doctorId,
            LocalDate appointmentDate
    );

    List<Appointment> findByDoctor_IdAndAppointmentDateAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            Collection<AppointmentStatus> statuses
    );

    boolean existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(
            Long patientId,
            LocalDate appointmentDate,
            LocalTime startTime,
            Collection<AppointmentStatus> statuses
    );
}
