package com.tranminh.medicalclinic.exception;

public class InvalidAppointmentDateRangeException extends RuntimeException {

    public InvalidAppointmentDateRangeException() {
        super("fromDate must be before or equal to toDate.");
    }
}
