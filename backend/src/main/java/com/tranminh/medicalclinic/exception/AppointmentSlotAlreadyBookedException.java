package com.tranminh.medicalclinic.exception;

public class AppointmentSlotAlreadyBookedException extends RuntimeException {

    public AppointmentSlotAlreadyBookedException() {
        super("The doctor appointment slot is already booked.");
    }
}
