package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CancelAppointmentRequest;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.AppointmentNotFoundException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentStatusTransitionException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ReceptionistAppointmentCancellationService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public ReceptionistAppointmentCancellationService(AppointmentRepository appointmentRepository, UserRepository userRepository, Clock clock) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional
    public void cancel(Long receptionistUserId, Long appointmentId, CancelAppointmentRequest request) {
        User receptionist = userRepository.findById(receptionistUserId).orElseThrow(AccountInactiveException::new);
        if (receptionist.getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));
        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new InvalidAppointmentStatusTransitionException();
        }
        appointment.cancel(receptionist, request.reason(), LocalDateTime.now(clock));
    }
}
