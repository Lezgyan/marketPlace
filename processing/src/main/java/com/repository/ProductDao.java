package com.repository;

import com.dto.Product;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mapper.ProductMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public class ProductDao {
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper mapper;

    public ProductDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public Product getProductById(UUID id) {
        try {
            String sql = "SELECT id, name, raw_data FROM products WHERE id = ?";

            return jdbcTemplate.queryForObject(
                    sql,
                    new Object[]{id},
                    (rs, rowNum) -> {
                        UUID productId = rs.getObject("id", UUID.class);
                        String name = rs.getString("name");

                        String rawJson = rs.getString("raw_data");

                        JsonNode rawData = null;
                        try {
                            rawData = mapper.readTree(rawJson);
                        } catch (JsonProcessingException e) {
                            throw new RuntimeException(e);
                        }

                        return new Product(productId, name, rawData);
                    });


        } catch (Exception e) {
            throw new RuntimeException("Product not found", e);
        }
    }

    public int numberProducts(){
        String sql = "select count(*) from products";

        return jdbcTemplate.queryForObject(sql, Integer.class);
    }


    public Product getRandomProduct(int offset){
        String sql = "select * from products LIMIT 1 OFFSET ?";

        return jdbcTemplate.queryForObject(sql, new ProductMapper(), offset);
    }

    public Boolean isTableEmpty(){
        String sql = "select count(*) from products";

        return Integer.valueOf(0).equals(jdbcTemplate.queryForObject(sql, Integer.class));
    }

}
