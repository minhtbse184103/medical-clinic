package com.tranminh.medicalclinic.exception;

public class InvalidAppointmentStatusTransitionException extends RuntimeException {
    public InvalidAppointmentStatusTransitionException() {
        super("Only PENDING appointments can be confirmed.");
    }
}
