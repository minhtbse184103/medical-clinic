package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.DoctorPatientMedicalRecordPageResponse;
import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.DoctorPatientMedicalRecordAccessDeniedException;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.exception.PatientNotFoundException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import com.tranminh.medicalclinic.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorPatientMedicalRecordQueryService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public DoctorPatientMedicalRecordQueryService(
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            MedicalRecordRepository medicalRecordRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @Transactional(readOnly = true)
    public DoctorPatientMedicalRecordPageResponse getPatientMedicalRecords(
            Long doctorUserId,
            Long patientId,
            int page,
            int size
    ) {
        Doctor doctor = doctorRepository.findByUser_Id(doctorUserId)
                .orElseThrow(() -> new DoctorProfileNotFoundException(doctorUserId));
        if (doctor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException(patientId));
        if (!appointmentRepository.existsByDoctor_IdAndPatient_Id(doctor.getId(), patientId)) {
            throw new DoctorPatientMedicalRecordAccessDeniedException();
        }

        Page<MedicalRecord> records = medicalRecordRepository.findByPatientId(
                patientId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );

        return new DoctorPatientMedicalRecordPageResponse(
                patientId,
                records.getContent().stream().map(this::toResponse).toList(),
                records.getNumber(),
                records.getSize(),
                records.getTotalElements(),
                records.getTotalPages()
        );
    }

    private MedicalRecordResponse toResponse(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getAppointment().getId(),
                record.getSymptoms(),
                record.getDiagnosis(),
                record.getTreatment(),
                record.getNotes(),
                record.getCreatedAt()
        );
    }
}
