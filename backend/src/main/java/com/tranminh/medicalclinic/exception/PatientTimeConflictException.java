package com.tranminh.medicalclinic.exception;

public class PatientTimeConflictException extends RuntimeException {

    public PatientTimeConflictException() {
        super("Patient already has an active appointment at this time.");
    }
}
