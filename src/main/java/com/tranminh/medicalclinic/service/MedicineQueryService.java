package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.MedicineCatalogResponse;
import com.tranminh.medicalclinic.dto.response.MedicinePageResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicineRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicineQueryService {

    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;

    public MedicineQueryService(DoctorRepository doctorRepository, MedicineRepository medicineRepository) {
        this.doctorRepository = doctorRepository;
        this.medicineRepository = medicineRepository;
    }

    @Transactional(readOnly = true)
    public MedicinePageResponse getMedicines(Long doctorUserId, String name, Boolean active, int page, int size) {
        Doctor doctor = doctorRepository.findByUser_Id(doctorUserId)
                .orElseThrow(() -> new DoctorProfileNotFoundException(doctorUserId));
        if (doctor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }
        String nameFilter = name == null || name.isBlank() ? null : name.trim();
        Page<Medicine> medicines = medicineRepository.search(
                nameFilter,
                active,
                PageRequest.of(page, size, Sort.by("name").ascending())
        );
        return new MedicinePageResponse(
                medicines.getContent().stream().map(this::toResponse).toList(),
                medicines.getNumber(), medicines.getSize(), medicines.getTotalElements(), medicines.getTotalPages()
        );
    }

    private MedicineCatalogResponse toResponse(Medicine medicine) {
        return new MedicineCatalogResponse(
                medicine.getId(), medicine.getName(), medicine.getUnit(), medicine.getDescription(), medicine.isActive()
        );
    }
}
