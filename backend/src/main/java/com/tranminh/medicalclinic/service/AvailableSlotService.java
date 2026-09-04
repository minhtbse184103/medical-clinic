package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.AvailableSlotResponse;
import com.tranminh.medicalclinic.dto.response.AvailableSlotsResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
public class AvailableSlotService {

    private static final int SLOT_DURATION_MINUTES = 30;
    private static final Set<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    public AvailableSlotService(
            DoctorRepository doctorRepository,
            DoctorScheduleRepository doctorScheduleRepository,
            AppointmentRepository appointmentRepository,
            Clock clock
    ) {
        this.doctorRepository = doctorRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.appointmentRepository = appointmentRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AvailableSlotsResponse getAvailableSlots(Long doctorId, LocalDate date) {
        doctorRepository.findByIdAndUser_Status(doctorId, UserStatus.ACTIVE)
                .orElseThrow(() -> new DoctorNotFoundException(doctorId));

        if (date.isBefore(LocalDate.now(clock))) {
            return new AvailableSlotsResponse(doctorId, date, SLOT_DURATION_MINUTES, List.of());
        }

        List<Appointment> activeAppointments = appointmentRepository
                .findByDoctor_IdAndAppointmentDateAndStatusIn(
                        doctorId,
                        date,
                        ACTIVE_APPOINTMENT_STATUSES
                );

        List<AvailableSlotResponse> slots = doctorScheduleRepository
                .findByDoctor_IdAndDayOfWeekOrderByStartTime(doctorId, date.getDayOfWeek())
                .stream()
                .flatMap(schedule -> generateSlots(schedule, date, activeAppointments).stream())
                .toList();

        return new AvailableSlotsResponse(doctorId, date, SLOT_DURATION_MINUTES, slots);
    }

    private List<AvailableSlotResponse> generateSlots(
            DoctorSchedule schedule,
            LocalDate date,
            List<Appointment> activeAppointments
    ) {
        LocalTime slotStart = schedule.getStartTime();
        List<AvailableSlotResponse> slots = new java.util.ArrayList<>();

        while (!slotStart.plusMinutes(SLOT_DURATION_MINUTES).isAfter(schedule.getEndTime())) {
            LocalTime slotEnd = slotStart.plusMinutes(SLOT_DURATION_MINUTES);
            if (isFutureSlot(date, slotStart) && !isBooked(slotStart, slotEnd, activeAppointments)) {
                slots.add(new AvailableSlotResponse(slotStart, slotEnd));
            }
            slotStart = slotEnd;
        }

        return slots;
    }

    private boolean isFutureSlot(LocalDate date, LocalTime slotStart) {
        return LocalDateTime.of(date, slotStart).isAfter(LocalDateTime.now(clock));
    }

    private boolean isBooked(LocalTime slotStart, LocalTime slotEnd, List<Appointment> activeAppointments) {
        return activeAppointments.stream().anyMatch(appointment ->
                appointment.getStartTime().isBefore(slotEnd)
                        && appointment.getEndTime().isAfter(slotStart)
        );
    }
}
