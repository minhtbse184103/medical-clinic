package com.tranminh.medicalclinic.exception;

public class DoctorNotFoundException extends RuntimeException {

    public DoctorNotFoundException(Long doctorId) {
        super("Doctor not found: " + doctorId);
    }
}
