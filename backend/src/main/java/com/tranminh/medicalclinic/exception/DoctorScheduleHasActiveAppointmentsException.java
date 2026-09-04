package com.tranminh.medicalclinic.exception;

public class DoctorScheduleHasActiveAppointmentsException extends RuntimeException {

    public DoctorScheduleHasActiveAppointmentsException() {
        super("Cannot delete a schedule that still covers future active appointments.");
    }
}
