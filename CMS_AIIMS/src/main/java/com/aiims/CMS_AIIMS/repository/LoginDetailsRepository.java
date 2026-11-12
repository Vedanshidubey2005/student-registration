package com.aiims.CMS_AIIMS.repository;

import com.aiims.CMS_AIIMS.entity.LoginDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginDetailsRepository extends JpaRepository<LoginDetails, String> {
}