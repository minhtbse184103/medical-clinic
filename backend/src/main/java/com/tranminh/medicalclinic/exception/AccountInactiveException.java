package com.tranminh.medicalclinic.exception;

public class AccountInactiveException extends RuntimeException {

    public AccountInactiveException() {
        super("Account is inactive.");
    }
}
