package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.ConfirmAppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.AppointmentNotFoundException;
import com.tranminh.medicalclinic.exception.AppointmentTimePassedException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentStatusTransitionException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class AppointmentConfirmationService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public AppointmentConfirmationService(AppointmentRepository appointmentRepository, UserRepository userRepository, Clock clock) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional
    public ConfirmAppointmentResponse confirm(Long receptionistUserId, Long appointmentId) {
        if (userRepository.findById(receptionistUserId).orElseThrow(AccountInactiveException::new).getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new InvalidAppointmentStatusTransitionException();
        }
        if (appointment.getPatient().getUser().getStatus() != UserStatus.ACTIVE
                || appointment.getDoctor().getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (!LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime()).isAfter(now)) {
            throw new AppointmentTimePassedException();
        }
        appointment.confirm(now);
        return new ConfirmAppointmentResponse(appointment.getId(), appointment.getStatus(), appointment.getConfirmedAt());
    }
}
