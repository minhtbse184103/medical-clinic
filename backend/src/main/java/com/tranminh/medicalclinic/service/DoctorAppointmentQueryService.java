package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.DoctorAppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class DoctorAppointmentQueryService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public DoctorAppointmentQueryService(
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public DoctorAppointmentPageResponse getMyAppointments(
            Long userId,
            LocalDate date,
            AppointmentStatus status,
            int page,
            int size
    ) {
        Doctor doctor = doctorRepository.findByUser_Id(userId)
                .orElseThrow(() -> new DoctorProfileNotFoundException(userId));
        if (doctor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }

        Page<Appointment> appointments = appointmentRepository.findDoctorAppointments(
                doctor.getId(),
                date,
                status,
                PageRequest.of(page, size, Sort.by("appointmentDate").ascending().and(Sort.by("startTime").ascending()))
        );

        return new DoctorAppointmentPageResponse(
                appointments.getContent().stream().map(this::toResponse).toList(),
                appointments.getNumber(),
                appointments.getSize(),
                appointments.getTotalElements(),
                appointments.getTotalPages()
        );
    }

    private DoctorAppointmentResponse toResponse(Appointment appointment) {
        return new DoctorAppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getFullName(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getReason(),
                appointment.getCreatedAt()
        );
    }
}
