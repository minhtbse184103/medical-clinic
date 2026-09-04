package com.tranminh.medicalclinic.exception;

public class MedicalRecordAlreadyExistsException extends RuntimeException {
    public MedicalRecordAlreadyExistsException(Long appointmentId) {
        super("Medical record already exists for appointment: " + appointmentId);
    }
}
