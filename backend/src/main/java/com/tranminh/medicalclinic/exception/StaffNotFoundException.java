package com.tranminh.medicalclinic.exception;

public class StaffNotFoundException extends RuntimeException {

    public StaffNotFoundException(Long userId) {
        super("Staff user was not found: " + userId);
    }
}
