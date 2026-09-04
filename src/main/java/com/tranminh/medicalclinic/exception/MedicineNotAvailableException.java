package com.tranminh.medicalclinic.exception;

public class MedicineNotAvailableException extends RuntimeException {
    public MedicineNotAvailableException(Long medicineId) { super("Medicine is unavailable: " + medicineId); }
}
