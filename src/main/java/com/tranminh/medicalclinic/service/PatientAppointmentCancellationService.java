package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.exception.AppointmentCancellationDeadlinePassedException;
import com.tranminh.medicalclinic.exception.AppointmentNotFoundException;
import com.tranminh.medicalclinic.exception.AppointmentOwnershipException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentStatusTransitionException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class PatientAppointmentCancellationService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public PatientAppointmentCancellationService(AppointmentRepository appointmentRepository, UserRepository userRepository, Clock clock) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional
    public void cancel(Long userId, Long appointmentId, CancelAppointmentRequest request) {
        User patientUser = userRepository.findById(userId).orElseThrow(AppointmentOwnershipException::new);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));
        if (!appointment.getPatient().getUser().getId().equals(userId)) {
            throw new AppointmentOwnershipException();
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new InvalidAppointmentStatusTransitionException();
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime()).isBefore(now.plusHours(2))) {
            throw new AppointmentCancellationDeadlinePassedException();
        }
        appointment.cancel(patientUser, request.reason(), now);
    }
}
