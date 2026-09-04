package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.PatientAppointmentPageResponse;
import com.tranminh.medicalclinic.dto.response.PatientAppointmentResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.exception.InvalidAppointmentDateRangeException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentSortException;
import com.tranminh.medicalclinic.exception.PatientProfileNotFoundException;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class PatientAppointmentQueryService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    public PatientAppointmentQueryService(
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public PatientAppointmentPageResponse getMyAppointments(
            Long userId,
            AppointmentStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sort
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new InvalidAppointmentDateRangeException();
        }

        PageRequest pageable = PageRequest.of(page, size, toSort(sort));

        Long patientId = patientRepository.findByUser_Id(userId)
                .orElseThrow(() -> new PatientProfileNotFoundException(userId))
                .getId();

        Page<Appointment> appointments = appointmentRepository.findPatientAppointments(
                patientId,
                status,
                fromDate,
                toDate,
                pageable
        );

        return new PatientAppointmentPageResponse(
                appointments.getContent().stream().map(this::toResponse).toList(),
                appointments.getNumber(),
                appointments.getSize(),
                appointments.getTotalElements(),
                appointments.getTotalPages()
        );
    }

    private Sort toSort(String sort) {
        String[] parts = sort.split(",", -1);
        if (parts.length != 2 || !"appointmentDate".equals(parts[0])) {
            throw new InvalidAppointmentSortException();
        }

        Sort.Direction direction = Sort.Direction.fromOptionalString(parts[1])
                .orElseThrow(InvalidAppointmentSortException::new);
        return Sort.by(direction, "appointmentDate").and(Sort.by(direction, "startTime"));
    }

    private PatientAppointmentResponse toResponse(Appointment appointment) {
        return new PatientAppointmentResponse(
                appointment.getId(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getFullName(),
                appointment.getDoctor().getSpecialty(),
                appointment.getAppointmentDate(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getReason(),
                appointment.getCreatedAt()
        );
    }
}
