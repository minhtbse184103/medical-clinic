package com.tranminh.medicalclinic.exception;

public class PrescriptionAlreadyExistsException extends RuntimeException {
    public PrescriptionAlreadyExistsException(Long medicalRecordId) { super("Prescription already exists for medical record: " + medicalRecordId); }
}
