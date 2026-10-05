package com.aiims.CMS_AIIMS.repository;

import com.aiims.CMS_AIIMS.entity.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, String> {
    boolean existsByEmail(String email);
}