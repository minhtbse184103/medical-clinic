package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.CreateMedicalRecordRequest;
import com.tranminh.medicalclinic.dto.response.MedicalRecordResponse;
import com.tranminh.medicalclinic.entity.Appointment;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.MedicalRecord;
import com.tranminh.medicalclinic.entity.Patient;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.AppointmentStatus;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorAppointmentAccessDeniedException;
import com.tranminh.medicalclinic.exception.MedicalRecordAlreadyExistsException;
import com.tranminh.medicalclinic.repository.AppointmentRepository;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicalRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {
    @Mock private DoctorRepository doctorRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private MedicalRecordRepository medicalRecordRepository;
    private MedicalRecordService service;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        service = new MedicalRecordService(doctorRepository, appointmentRepository, medicalRecordRepository,
                Clock.fixed(Instant.parse("2026-09-10T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
        doctor = doctor(5L);
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.of(doctor));
    }

    @Test
    void createMedicalRecord_savesRecordAndCompletesAppointment() {
        Appointment appointment = appointment(doctor, AppointmentStatus.CONFIRMED, LocalTime.of(8, 0));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(medicalRecordRepository.existsByAppointment_Id(101L)).thenReturn(false);
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenAnswer(invocation -> {
            MedicalRecord record = invocation.getArgument(0);
            ReflectionTestUtils.setField(record, "id", 55L);
            ReflectionTestUtils.setField(record, "createdAt", LocalDateTime.of(2026, 9, 10, 9, 0));
            return record;
        });

        MedicalRecordResponse response = service.createMedicalRecord(2L, 101L, request());

        assertEquals(55L, response.medicalRecordId());
        assertEquals(AppointmentStatus.COMPLETED, appointment.getStatus());
    }

    @Test
    void createMedicalRecord_rejectsOtherDoctorsAppointment() {
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(doctor(9L), AppointmentStatus.CONFIRMED, LocalTime.of(8, 0))));

        assertThrows(DoctorAppointmentAccessDeniedException.class, () -> service.createMedicalRecord(2L, 101L, request()));
    }

    @Test
    void createMedicalRecord_rejectsDuplicateRecord() {
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment(doctor, AppointmentStatus.CONFIRMED, LocalTime.of(8, 0))));
        when(medicalRecordRepository.existsByAppointment_Id(101L)).thenReturn(true);

        assertThrows(MedicalRecordAlreadyExistsException.class, () -> service.createMedicalRecord(2L, 101L, request()));
    }

    private CreateMedicalRecordRequest request() { return new CreateMedicalRecordRequest("Fever", "Flu", "Rest", "Observe"); }
    private Doctor doctor(Long id) {
        Doctor result = new Doctor(new User("doctor" + id + "@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-" + id, "Bio");
        ReflectionTestUtils.setField(result, "id", id);
        return result;
    }
    private Appointment appointment(Doctor owner, AppointmentStatus status, LocalTime start) {
        Patient patient = new Patient(new User("patient@example.com", "hash", Role.PATIENT), "Patient", "0901", LocalDate.of(2000, 1, 1), Gender.OTHER, "Ha Noi");
        Appointment result = new Appointment(patient, owner, LocalDate.of(2026, 9, 10), start, start.plusMinutes(30), status, "Checkup");
        ReflectionTestUtils.setField(result, "id", 101L);
        return result;
    }
}
