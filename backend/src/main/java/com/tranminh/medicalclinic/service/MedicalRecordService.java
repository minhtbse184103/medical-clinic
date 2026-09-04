package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateMedicalRecordRequest;
import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.AppointmentNotFoundException;
import com.tranminh.medicalclinic.exception.AppointmentTimeNotReachedException;
import com.tranminh.medicalclinic.exception.DoctorAppointmentAccessDeniedException;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.exception.InvalidAppointmentStatusTransitionException;
import com.tranminh.medicalclinic.exception.MedicalRecordAlreadyExistsException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class MedicalRecordService {
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final Clock clock;

    public MedicalRecordService(DoctorRepository doctorRepository, AppointmentRepository appointmentRepository,
                                MedicalRecordRepository medicalRecordRepository, Clock clock) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.clock = clock;
    }

    @Transactional
    public MedicalRecordResponse createMedicalRecord(Long userId, Long appointmentId, CreateMedicalRecordRequest request) {
        Doctor doctor = doctorRepository.findByUser_Id(userId)
                .orElseThrow(() -> new DoctorProfileNotFoundException(userId));
        if (doctor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));
        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new DoctorAppointmentAccessDeniedException();
        }
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new InvalidAppointmentStatusTransitionException();
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (LocalDateTime.of(appointment.getAppointmentDate(), appointment.getStartTime()).isAfter(now)) {
            throw new AppointmentTimeNotReachedException();
        }
        if (medicalRecordRepository.existsByAppointment_Id(appointmentId)) {
            throw new MedicalRecordAlreadyExistsException(appointmentId);
        }

        MedicalRecord record = medicalRecordRepository.save(new MedicalRecord(
                appointment, request.symptoms(), request.diagnosis(), request.treatment(), request.notes()
        ));
        appointment.complete(now);
        return new MedicalRecordResponse(record.getId(), appointmentId, record.getSymptoms(), record.getDiagnosis(),
                record.getTreatment(), record.getNotes(), record.getCreatedAt());
    }
}
