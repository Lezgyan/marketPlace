package com.service;

import com.dto.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.repository.ProductDao;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

@Slf4j
@Service
public class FavoriteService {
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;

    public FavoriteService(RestTemplate restTemplate, JdbcTemplate jdbcTemplate) {
        this.restTemplate = restTemplate;
        this.jdbcTemplate = jdbcTemplate;
    }
    public void addFavorite(Favorite favorite) {
        String sql = """
            INSERT INTO favorites (id, userId, productId)
            VALUES (?, ?, ?)
            ON CONFLICT (id) DO NOTHING
            """;
        UUID id = UUID.randomUUID();


        jdbcTemplate.update(sql, id, favorite.getUserId(), favorite.getProductId());
    }

}
