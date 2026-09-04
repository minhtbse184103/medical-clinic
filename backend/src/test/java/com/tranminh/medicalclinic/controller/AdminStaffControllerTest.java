package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.CreateReceptionistRequest;
import com.tranminh.medicalclinic.dto.response.StaffResponse;
import com.tranminh.medicalclinic.enums.Role;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.GlobalExceptionHandler;
import com.tranminh.medicalclinic.security.JwtService;
import com.tranminh.medicalclinic.security.RestAccessDeniedHandler;
import com.tranminh.medicalclinic.security.RestAuthenticationEntryPoint;
import com.tranminh.medicalclinic.security.SecurityConfig;
import com.tranminh.medicalclinic.service.AdminStaffService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminStaffController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class AdminStaffControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AdminStaffService service;
    @MockitoBean private JwtService jwtService;

    @Test
    void createReceptionist_returnsCreatedForAdmin() throws Exception {
        when(service.createReceptionist(any(CreateReceptionistRequest.class))).thenReturn(response());

        mockMvc.perform(post("/api/v1/admin/receptionists")
                        .with(authentication(user(1L, "ROLE_ADMIN")))
                        .contentType("application/json")
                        .content("{\"email\":\"receptionist@example.com\",\"temporaryPassword\":\"Temp123!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("RECEPTIONIST"));
    }

    @Test
    void deactivate_returnsForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/3/deactivate")
                        .with(authentication(user(2L, "ROLE_DOCTOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private StaffResponse response() {
        return new StaffResponse(3L, "receptionist@example.com", Role.RECEPTIONIST, UserStatus.ACTIVE, null);
    }

    private UsernamePasswordAuthenticationToken user(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role)));
    }
}
