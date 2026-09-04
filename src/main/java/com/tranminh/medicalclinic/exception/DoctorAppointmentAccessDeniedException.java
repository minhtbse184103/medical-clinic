package com.tranminh.medicalclinic.exception;

public class DoctorAppointmentAccessDeniedException extends RuntimeException {
    public DoctorAppointmentAccessDeniedException() {
        super("This appointment does not belong to the authenticated doctor.");
    }
}
