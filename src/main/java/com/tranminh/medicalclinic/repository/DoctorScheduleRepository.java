package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctor_IdAndDayOfWeekOrderByStartTime(Long doctorId, DayOfWeek dayOfWeek);
}
