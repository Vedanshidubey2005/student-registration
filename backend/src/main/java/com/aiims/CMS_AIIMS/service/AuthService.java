package com.aiims.CMS_AIIMS.service;

import com.aiims.CMS_AIIMS.dto.AuthResponseDTO;
import com.aiims.CMS_AIIMS.dto.LoginRequestDTO;
import com.aiims.CMS_AIIMS.dto.RegistrationRequestDTO;
import com.aiims.CMS_AIIMS.entity.LoginDetails;
import com.aiims.CMS_AIIMS.entity.UserInfo;
import com.aiims.CMS_AIIMS.repository.LoginDetailsRepository;
import com.aiims.CMS_AIIMS.repository.UserInfoRepository;
import com.aiims.CMS_AIIMS.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserInfoRepository userInfoRepository;
    private final LoginDetailsRepository loginDetailsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserInfoRepository userInfoRepository,
                       LoginDetailsRepository loginDetailsRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userInfoRepository = userInfoRepository;
        this.loginDetailsRepository = loginDetailsRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // 1. REGISTRATION
    @Transactional
    public AuthResponseDTO register(RegistrationRequestDTO request) {
        // Password and confirmPassword match check
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return new AuthResponseDTO(false, "Password and Confirm Password do not match!");
        }

        // Email duplicate check
        if (userInfoRepository.existsByEmail(request.getEmail())) {
            return new AuthResponseDTO(false, "Email is already registered!");
        }

        // Hash password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Process photo bytes
        byte[] photoBytes = null;
        if (request.getPhoto() != null && !request.getPhoto().isEmpty()) {
            try {
                photoBytes = request.getPhoto().getBytes();
            } catch (IOException e) {
                return new AuthResponseDTO(false, "Failed to read photo file!");
            }
        }

        // Save into user_info
        UserInfo userInfo = new UserInfo();
        userInfo.setEmail(request.getEmail());
        userInfo.setFullName(request.getFullName());
        userInfo.setMobileNo(request.getMobileNo());
        userInfo.setDob(request.getDob());
        userInfo.setGender(request.getGender());
        userInfo.setPassword(hashedPassword);
        userInfo.setPincode(request.getPincode());
        userInfo.setPhoto(photoBytes);
        userInfoRepository.save(userInfo);

        // Save into login_details
        LoginDetails loginDetails = new LoginDetails();
        loginDetails.setEmail(request.getEmail());
        loginDetails.setPassword(hashedPassword);
        loginDetailsRepository.save(loginDetails);

        return new AuthResponseDTO(true, "Registration successful!");
    }

    // 2. LOGIN
    @Transactional
    public AuthResponseDTO login(LoginRequestDTO request) {
        // Find credentials in login_details table
        LoginDetails loginDetails = loginDetailsRepository.findById(request.getEmail())
                .orElse(null);

        if (loginDetails == null) {
            return new AuthResponseDTO(false, "Invalid email or user not found!");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), loginDetails.getPassword())) {
            return new AuthResponseDTO(false, "Invalid password!");
        }

        // Update last_login_time
        loginDetails.setLastLoginTime(LocalDateTime.now());
        loginDetailsRepository.save(loginDetails);

        // Generate JWT
        String token = jwtUtil.generateToken(loginDetails.getEmail());

        return new AuthResponseDTO(true, "Login successful!", token, loginDetails.getEmail());
    }

    // 3. LOGOUT
    @Transactional
    public AuthResponseDTO logout(String email) {
        LoginDetails loginDetails = loginDetailsRepository.findById(email).orElse(null);

        if (loginDetails != null) {
            loginDetails.setLastLogoutTime(LocalDateTime.now());
            loginDetailsRepository.save(loginDetails);
            return new AuthResponseDTO(true, "Logout successful!");
        }

        return new AuthResponseDTO(false, "User not found for logout!");
    }
}