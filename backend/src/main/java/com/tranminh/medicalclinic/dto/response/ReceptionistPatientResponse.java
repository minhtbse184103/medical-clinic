package com.tranminh.medicalclinic.dto.response;

import com.tranminh.medicalclinic.enums.Gender;

import java.time.LocalDate;

/**
 * Patient data a Receptionist needs to identify the right person when booking on their behalf.
 * Name, phone and date of birth are enough to tell two similarly named patients apart;
 * email and internal User fields are deliberately excluded.
 */
public record ReceptionistPatientResponse(
        Long patientId,
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        Gender gender
) {
}
