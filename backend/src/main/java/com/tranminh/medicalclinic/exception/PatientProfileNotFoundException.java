package com.tranminh.medicalclinic.exception;

public class PatientProfileNotFoundException extends RuntimeException {

    public PatientProfileNotFoundException(Long userId) {
        super("Patient profile not found for user id: " + userId);
    }
}
