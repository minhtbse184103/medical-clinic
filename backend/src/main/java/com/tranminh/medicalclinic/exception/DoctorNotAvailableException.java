package com.tranminh.medicalclinic.exception;

public class DoctorNotAvailableException extends RuntimeException {

    public DoctorNotAvailableException(Long doctorId) {
        super("Doctor is not available: " + doctorId);
    }
}
