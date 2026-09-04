package com.tranminh.medicalclinic.exception;

public class DoctorPatientMedicalRecordAccessDeniedException extends RuntimeException {

    public DoctorPatientMedicalRecordAccessDeniedException() {
        super("Doctor does not have a clinical relationship with this patient.");
    }
}
