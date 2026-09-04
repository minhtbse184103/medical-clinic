package com.tranminh.medicalclinic.exception;

public class DoctorScheduleOverlapException extends RuntimeException {

    public DoctorScheduleOverlapException() {
        super("Schedule overlaps an existing doctor schedule.");
    }
}
