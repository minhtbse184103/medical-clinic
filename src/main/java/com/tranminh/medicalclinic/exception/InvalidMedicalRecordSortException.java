package com.tranminh.medicalclinic.exception;

public class InvalidMedicalRecordSortException extends RuntimeException {

    public InvalidMedicalRecordSortException() {
        super("sort must be createdAt,asc or createdAt,desc.");
    }
}
