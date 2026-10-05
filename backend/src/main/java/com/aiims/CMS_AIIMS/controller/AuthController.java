package com.aiims.CMS_AIIMS.controller;

import com.aiims.CMS_AIIMS.dto.AuthResponseDTO;
import com.aiims.CMS_AIIMS.dto.LoginRequestDTO;
import com.aiims.CMS_AIIMS.dto.RegistrationRequestDTO;
import com.aiims.CMS_AIIMS.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Frontend connect karne ke liye CORS open
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 1. REGISTRATION ENDPOINT (Accepts form-data with file)
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponseDTO> registerUser(@ModelAttribute RegistrationRequestDTO request) {
        AuthResponseDTO response = authService.register(request);

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. LOGIN ENDPOINT (Accepts JSON)
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> loginUser(@RequestBody LoginRequestDTO request) {
        AuthResponseDTO response = authService.login(request);

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    // 3. LOGOUT ENDPOINT
    @PostMapping("/logout")
    public ResponseEntity<AuthResponseDTO> logoutUser(@RequestParam String email) {
        AuthResponseDTO response = authService.logout(email);

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        return ResponseEntity.ok(response);
    }
}