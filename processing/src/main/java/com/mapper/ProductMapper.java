package com.mapper;

import com.dto.Product;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class ProductMapper implements RowMapper<Product> {

    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Product mapRow(ResultSet rs, int rowNum) throws SQLException {
        try {
            Product product = new Product(
                    UUID.fromString(rs.getString("id")),
                    rs.getString("name"),
                    objectMapper.readTree(rs.getString("raw_data"))
            );
            return product;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
