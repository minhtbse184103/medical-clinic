package com.tranminh.medicalclinic.exception;

public class AppointmentTimePassedException extends RuntimeException {

    public AppointmentTimePassedException() {
        super("Appointment time must be in the future.");
    }
}
