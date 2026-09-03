package com.tranminh.medicalclinic.exception;

public class DoctorLicenseNumberAlreadyExistsException extends RuntimeException {

    public DoctorLicenseNumberAlreadyExistsException(String licenseNumber) {
        super("Doctor license number already exists: " + licenseNumber);
    }
}
