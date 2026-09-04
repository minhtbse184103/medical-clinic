package com.tranminh.medicalclinic.security;

import com.tranminh.medicalclinic.entity.User;
import com.tranminh.medicalclinic.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private static final String ROLE_CLAIM = "role";
    private static final String TOKEN_TYPE_CLAIM = "tokenType";
    private static final String ACCESS_TOKEN_TYPE = "ACCESS";
    private static final String REFRESH_TOKEN_TYPE = "REFRESH";

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = createSigningKey(jwtProperties.secret());
    }

    public String generateAccessToken(User user) {
        return generateToken(
                user,
                Map.of(
                        ROLE_CLAIM, user.getRole().name(),
                        TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE
                ),
                jwtProperties.accessTokenExpirationSeconds()
        );
    }

    public String generateRefreshToken(User user) {
        return generateToken(
                user,
                Map.of(
                        TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE,
                        "jti", UUID.randomUUID().toString()
                ),
                jwtProperties.refreshTokenExpirationSeconds()
        );
    }

    public String extractTokenId(String token) {
        return extractClaims(token).getId();
    }

    public Instant extractExpiration(String token) {
        return extractClaims(token).getExpiration().toInstant();
    }

    public long extractUserId(String token) {
        return Long.parseLong(extractClaims(token).getSubject());
    }

    public Role extractRole(String token) {
        return Role.valueOf(extractClaims(token).get(ROLE_CLAIM, String.class));
    }

    public boolean isAccessToken(String token) {
        return ACCESS_TOKEN_TYPE.equals(extractClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
    }

    public boolean isRefreshToken(String token) {
        return REFRESH_TOKEN_TYPE.equals(extractClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
    }

    private String generateToken(User user, Map<String, Object> claims, long expirationSeconds) {
        Instant issuedAt = Instant.now();
        Instant expiration = issuedAt.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(claims)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey createSigningKey(String base64Secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be a valid Base64 value representing at least 32 random bytes.",
                    exception
            );
        }
    }
}
