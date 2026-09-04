package com.tranminh.medicalclinic.exception;

public class InvalidAppointmentSortException extends RuntimeException {

    public InvalidAppointmentSortException() {
        super("sort must be appointmentDate,asc or appointmentDate,desc.");
    }
}
