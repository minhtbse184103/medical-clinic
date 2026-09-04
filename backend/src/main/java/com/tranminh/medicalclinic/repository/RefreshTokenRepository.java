package com.tranminh.medicalclinic.repository;

import com.tranminh.medicalclinic.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenIdAndUser_Id(String tokenId, Long userId);

    void deleteByTokenId(String tokenId);
}
