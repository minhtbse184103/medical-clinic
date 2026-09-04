package com.tranminh.medicalclinic.exception;

public class PrescriptionNotFoundException extends RuntimeException {

    public PrescriptionNotFoundException(Long medicalRecordId) {
        super("Prescription was not found for medical record: " + medicalRecordId);
    }
}
