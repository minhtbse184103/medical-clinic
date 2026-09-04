package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.ReceptionistAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.ReceptionistAppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class ReceptionistAppointmentQueryService {

    private final AppointmentRepository appointmentRepository;

    public ReceptionistAppointmentQueryService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public ReceptionistAppointmentPageResponse getAppointments(
            LocalDate date,
            Long doctorId,
            Long patientId,
            AppointmentStatus status,
            int page,
            int size
    ) {
        Page<Appointment> appointments = appointmentRepository.findReceptionistAppointments(
                date, doctorId, patientId, status,
                PageRequest.of(page, size, Sort.by("appointmentDate").ascending().and(Sort.by("startTime").ascending()))
        );
        return new ReceptionistAppointmentPageResponse(
                appointments.getContent().stream().map(this::toResponse).toList(),
                appointments.getNumber(), appointments.getSize(), appointments.getTotalElements(), appointments.getTotalPages()
        );
    }

    private ReceptionistAppointmentResponse toResponse(Appointment appointment) {
        return new ReceptionistAppointmentResponse(
                appointment.getId(), appointment.getPatient().getId(), appointment.getPatient().getFullName(),
                appointment.getDoctor().getId(), appointment.getDoctor().getFullName(), appointment.getDoctor().getSpecialty(),
                appointment.getAppointmentDate(), appointment.getStartTime(), appointment.getEndTime(), appointment.getStatus(),
                appointment.getReason(), appointment.getCreatedAt()
        );
    }
}
