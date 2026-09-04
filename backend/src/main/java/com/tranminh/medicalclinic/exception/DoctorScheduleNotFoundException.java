package com.tranminh.medicalclinic.exception;

public class DoctorScheduleNotFoundException extends RuntimeException {

    public DoctorScheduleNotFoundException(Long scheduleId) {
        super("Doctor schedule not found: " + scheduleId);
    }
}
