package com.tranminh.medicalclinic.exception;

public class AppointmentOwnershipException extends RuntimeException {

    public AppointmentOwnershipException() {
        super("This appointment does not belong to the authenticated patient.");
    }
}
