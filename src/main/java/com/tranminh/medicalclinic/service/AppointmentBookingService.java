package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateAppointmentRequest;
import com.tranminh.medicalclinic.dto.response.AppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.DoctorSchedule;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.AppointmentSlotAlreadyBookedException;
import com.tranminh.medicalclinic.exception.AppointmentSlotNotAvailableException;
import com.tranminh.medicalclinic.exception.AppointmentTimePassedException;
import com.tranminh.medicalclinic.exception.DoctorNotAvailableException;
import com.tranminh.medicalclinic.exception.DoctorNotFoundException;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.exception.PatientTimeConflictException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.DoctorScheduleRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

@Service
public class AppointmentBookingService {

    private static final int SLOT_DURATION_MINUTES = 30;
    private static final Set<AppointmentStatus> ACTIVE_APPOINTMENT_STATUSES = Set.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    public AppointmentBookingService(
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            DoctorScheduleRepository doctorScheduleRepository,
            AppointmentRepository appointmentRepository,
            Clock clock
    ) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.appointmentRepository = appointmentRepository;
        this.clock = clock;
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long userId, CreateAppointmentRequest request) {
        Patient patient = patientRepository.findByUser_Id(userId)
                .orElseThrow(() -> new PatientProfileNotFoundException(userId));
        if (patient.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }

        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new DoctorNotFoundException(request.doctorId()));
        if (doctor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new DoctorNotAvailableException(request.doctorId());
        }

        LocalTime endTime = request.startTime().plusMinutes(SLOT_DURATION_MINUTES);
        if (!LocalDateTime.of(request.appointmentDate(), request.startTime())
                .isAfter(LocalDateTime.now(clock))) {
            throw new AppointmentTimePassedException();
        }

        boolean belongsToSchedule = doctorScheduleRepository
                .findByDoctor_IdAndDayOfWeekOrderByStartTime(
                        doctor.getId(),
                        request.appointmentDate().getDayOfWeek()
                )
                .stream()
                .anyMatch(schedule -> isWithinSchedule(schedule, request.startTime(), endTime));
        if (!belongsToSchedule) {
            throw new AppointmentSlotNotAvailableException();
        }

        if (appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStartTimeAndStatusIn(
                doctor.getId(),
                request.appointmentDate(),
                request.startTime(),
                ACTIVE_APPOINTMENT_STATUSES
        )) {
            throw new AppointmentSlotAlreadyBookedException();
        }

        if (appointmentRepository.existsByPatient_IdAndAppointmentDateAndStartTimeAndStatusIn(
                patient.getId(),
                request.appointmentDate(),
                request.startTime(),
                ACTIVE_APPOINTMENT_STATUSES
        )) {
            throw new PatientTimeConflictException();
        }

        Appointment appointment = new Appointment(
                patient,
                doctor,
                request.appointmentDate(),
                request.startTime(),
                endTime,
                AppointmentStatus.PENDING,
                request.reason()
        );

        try {
            Appointment savedAppointment = appointmentRepository.saveAndFlush(appointment);
            return toResponse(savedAppointment);
        } catch (DataIntegrityViolationException exception) {
            throw new AppointmentSlotAlreadyBookedException();
        }
    }

    private boolean isWithinSchedule(DoctorSchedule schedule, LocalTime startTime, LocalTime endTime) {
        return !startTime.isBefore(schedule.getStartTime())
                && !endTime.isAfter(schedule.getEndTime());
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getDoctor().getId(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getReason(),
                appointment.getCreatedAt()
        );
    }
}
