package com.tranminh.medicalclinic.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long userId) {
        super("User not found for id: " + userId);
    }
}
