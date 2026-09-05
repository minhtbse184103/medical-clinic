package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.response.ReceptionistPatientPageResponse;
import com.tranminh.medicalclinic.dto.response.ReceptionistPatientResponse;
import com.tranminh.medicalclinic.enums.Gender;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.ReceptionistPatientQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReceptionistPatientController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class
})
class ReceptionistPatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReceptionistPatientQueryService receptionistPatientQueryService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void searchPatients_returnsIdentificationDataForReceptionist() throws Exception {
        when(receptionistPatientQueryService.searchPatients(0, 20, "cuong", null))
                .thenReturn(new ReceptionistPatientPageResponse(
                        List.of(new ReceptionistPatientResponse(
                                7L,
                                "Le Van Cuong",
                                "0900000003",
                                LocalDate.of(1995, 5, 20),
                                Gender.MALE
                        )),
                        0,
                        20,
                        1,
                        1
                ));

        mockMvc.perform(get("/api/v1/receptionist/patients")
                        .param("name", "cuong")
                        .with(authentication(authenticatedUser(5L, "ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].patientId").value(7))
                .andExpect(jsonPath("$.content[0].fullName").value("Le Van Cuong"))
                .andExpect(jsonPath("$.content[0].phone").value("0900000003"))
                // Email and internal User fields stay out of the Receptionist view.
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.content[0].userId").doesNotExist())
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(receptionistPatientQueryService).searchPatients(0, 20, "cuong", null);
    }

    @Test
    void searchPatients_returnsForbiddenForNonReceptionistRole() throws Exception {
        mockMvc.perform(get("/api/v1/receptionist/patients")
                        .with(authentication(authenticatedUser(10L, "ROLE_PATIENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchPatients_returnsUnauthorizedWithoutAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/receptionist/patients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void searchPatients_rejectsSizeAboveTheDocumentedMaximum() throws Exception {
        mockMvc.perform(get("/api/v1/receptionist/patients")
                        .param("size", "500")
                        .with(authentication(authenticatedUser(5L, "ROLE_RECEPTIONIST"))))
                .andExpect(status().isBadRequest());
    }

    private UsernamePasswordAuthenticationToken authenticatedUser(Long userId, String authority) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
    }
}
