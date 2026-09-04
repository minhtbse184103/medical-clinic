package com.tranminh.medicalclinic.exception;

public class AppointmentCancellationDeadlinePassedException extends RuntimeException {
    public AppointmentCancellationDeadlinePassedException() {
        super("Patients can cancel an appointment only at least 2 hours before it starts.");
    }
}
