package com.tranminh.medicalclinic.exception;

public class AppointmentTimeNotReachedException extends RuntimeException {
    public AppointmentTimeNotReachedException() {
        super("The appointment time has not been reached yet.");
    }
}
