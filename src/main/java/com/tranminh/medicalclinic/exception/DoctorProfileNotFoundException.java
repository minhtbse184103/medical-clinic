package com.tranminh.medicalclinic.exception;

public class DoctorProfileNotFoundException extends RuntimeException {

    public DoctorProfileNotFoundException(Long userId) {
        super("Doctor profile was not found for user id: " + userId);
    }
}
