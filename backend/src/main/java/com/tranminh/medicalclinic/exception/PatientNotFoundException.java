package com.tranminh.medicalclinic.exception;

public class PatientNotFoundException extends RuntimeException {

    public PatientNotFoundException(Long patientId) {
        super("Patient was not found: " + patientId);
    }
}
