package com.tranminh.medicalclinic.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/admin/doctors").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/doctors/*/schedules").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/doctors/*/schedules/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments/*/confirm").hasRole("RECEPTIONIST")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments/*/cancel").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments/*/medical-record").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments/me").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.GET, "/api/v1/doctor/appointments").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/receptionist/appointments").hasRole("RECEPTIONIST")
                        .requestMatchers(HttpMethod.POST, "/api/v1/receptionist/appointments/*/cancel").hasRole("RECEPTIONIST")
                        .requestMatchers(HttpMethod.GET, "/api/v1/doctors", "/api/v1/doctors/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/patients/me").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/patients/me").hasRole("PATIENT")
                        .anyRequest().authenticated()
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
