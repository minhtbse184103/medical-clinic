package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctor_IdAndDayOfWeekOrderByStartTime(Long doctorId, DayOfWeek dayOfWeek);

    List<DoctorSchedule> findByDoctor_Id(Long doctorId);

    Optional<DoctorSchedule> findByIdAndDoctor_Id(Long scheduleId, Long doctorId);

    boolean existsByDoctor_IdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
            Long doctorId,
            DayOfWeek dayOfWeek,
            LocalTime endTime,
            LocalTime startTime
    );

    boolean existsByDoctor_IdAndDayOfWeekAndIdNotAndStartTimeLessThanAndEndTimeGreaterThan(
            Long doctorId,
            DayOfWeek dayOfWeek,
            Long scheduleId,
            LocalTime endTime,
            LocalTime startTime
    );
}
