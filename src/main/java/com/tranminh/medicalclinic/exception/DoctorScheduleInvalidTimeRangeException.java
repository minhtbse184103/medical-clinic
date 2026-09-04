package com.tranminh.medicalclinic.exception;

public class DoctorScheduleInvalidTimeRangeException extends RuntimeException {

    public DoctorScheduleInvalidTimeRangeException() {
        super("Schedule start time must be before end time.");
    }
}
