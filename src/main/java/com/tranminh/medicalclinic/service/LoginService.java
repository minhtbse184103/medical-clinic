package com.tranminh.medicalclinic.service;

import com.tranminh.medicalclinic.dto.request.LoginRequest;
import com.tranminh.medicalclinic.dto.response.LoginResponse;
import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.UserStatus;
import com.tranminh.medicalclinic.exception.AccountInactiveException;
import com.tranminh.medicalclinic.exception.InvalidCredentialsException;
import com.tranminh.medicalclinic.repository.UserRepository;
import com.tranminh.medicalclinic.security.JwtProperties;
import com.tranminh.medicalclinic.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public LoginService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccountInactiveException();
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtProperties.accessTokenExpirationSeconds()
        );
    }
}
