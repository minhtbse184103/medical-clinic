package com.tranminh.medicalclinic.exception;

public class AppointmentSlotNotAvailableException extends RuntimeException {

    public AppointmentSlotNotAvailableException() {
        super("The requested appointment slot is not available in the doctor's schedule.");
    }
}
