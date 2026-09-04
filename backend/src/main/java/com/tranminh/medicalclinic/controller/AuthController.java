package com.tranminh.medicalclinic.controller;

import com.tranminh.medicalclinic.dto.request.LoginRequest;
import com.tranminh.medicalclinic.dto.request.RefreshTokenRequest;
import com.tranminh.medicalclinic.dto.request.RegisterPatientRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.dto.response.RegisterPatientResponse;
import com.tranminh.medicalclinic.service.LoginService;
import com.tranminh.medicalclinic.service.RegistrationService;
import com.tranminh.medicalclinic.service.TokenRefreshService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final LoginService loginService;
    private final TokenRefreshService tokenRefreshService;

    public AuthController(
            RegistrationService registrationService,
            LoginService loginService,
            TokenRefreshService tokenRefreshService
    ) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.tokenRefreshService = tokenRefreshService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterPatientResponse> registerPatient(
            @Valid @RequestBody RegisterPatientRequest request
    ) {
        RegisterPatientResponse response = registrationService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(loginService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(tokenRefreshService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        tokenRefreshService.logout(request);
        return ResponseEntity.noContent().build();
    }
}
