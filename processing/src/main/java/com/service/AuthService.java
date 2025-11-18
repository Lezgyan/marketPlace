package com.service;

import com.component.JwtService;
import com.dto.LoginRequest;
import com.dto.RegisterRequest;
import com.dto.User;
import com.repository.UserDao;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AuthService {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserDao userDao,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public void register(RegisterRequest request) {
        if (userDao.existsByUsername(request.username())) {
            throw new RuntimeException("Username already exists");
        }

        User u = new User();
        u.setUsername(request.username());
        u.setPassword(passwordEncoder.encode(request.password()));
        u.setEmail(request.email());
        u.setEnabled(true);
        u.setRoles(Set.of("ROLE_USER"));
        userDao.save(u);
    }

    public String login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(), request.password()
                )
        );
        return jwtService.generateToken(request.username());
    }
}
