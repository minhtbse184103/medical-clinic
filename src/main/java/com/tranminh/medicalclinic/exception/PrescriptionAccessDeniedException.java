package com.tranminh.medicalclinic.exception;

public class PrescriptionAccessDeniedException extends RuntimeException {

    public PrescriptionAccessDeniedException() {
        super("You do not have access to this prescription.");
    }
}
