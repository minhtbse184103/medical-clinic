package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.response.MedicinePageResponse;
import com.tranminh.medicalclinic.entity.Doctor;
import com.tranminh.medicalclinic.entity.Medicine;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.exception.DoctorProfileNotFoundException;
import com.tranminh.medicalclinic.repository.DoctorRepository;
import com.tranminh.medicalclinic.repository.MedicineRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicineQueryServiceTest {

    @Mock private DoctorRepository doctorRepository;
    @Mock private MedicineRepository medicineRepository;

    @Test
    void getMedicines_appliesFiltersAndReturnsCatalogueFields() {
        Medicine medicine = org.mockito.Mockito.mock(Medicine.class);
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.of(doctor()));
        when(medicine.getId()).thenReturn(3L);
        when(medicine.getName()).thenReturn("Paracetamol");
        when(medicine.getUnit()).thenReturn("tablet");
        when(medicine.getDescription()).thenReturn("Pain relief");
        when(medicine.isActive()).thenReturn(true);
        when(medicineRepository.search(eq("para"), eq(true), any())).thenReturn(new PageImpl<>(List.of(medicine)));

        MedicineQueryService service = new MedicineQueryService(doctorRepository, medicineRepository);
        MedicinePageResponse response = service.getMedicines(2L, " para ", true, 0, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(medicineRepository).search(eq("para"), eq(true), pageableCaptor.capture());
        assertEquals("name: ASC", pageableCaptor.getValue().getSort().toString());
        assertEquals("Paracetamol", response.content().getFirst().name());
    }

    @Test
    void getMedicines_rejectsMissingDoctorProfile() {
        when(doctorRepository.findByUser_Id(2L)).thenReturn(Optional.empty());
        MedicineQueryService service = new MedicineQueryService(doctorRepository, medicineRepository);

        assertThrows(DoctorProfileNotFoundException.class, () -> service.getMedicines(2L, null, null, 0, 20));
    }

    private Doctor doctor() {
        Doctor doctor = new Doctor(new User("doctor@example.com", "hash", Role.DOCTOR), "Dr. Tran", "0900", "Cardiology", "VN-1", "Bio");
        ReflectionTestUtils.setField(doctor, "id", 5L);
        return doctor;
    }
}
