package com.aiims.CMS_AIIMS.dto;

public class AuthResponseDTO {

    private boolean success;
    private String message;
    private String token; // For JWT if enabled, else null
    private String email;

    public AuthResponseDTO() {}

    public AuthResponseDTO(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public AuthResponseDTO(boolean success, String message, String token, String email) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.email = email;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}