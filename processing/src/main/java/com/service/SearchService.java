package com.service;

import com.dto.DtoQuery;
import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.dto.SearchDocument;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.Getter;
import lombok.ToString;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class SearchService {

    private final JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate;

    private final String searchServiceUrl = "http://localhost:8085";

    @Autowired
    private ObjectMapper mapper;


    public SearchService(RestTemplate restTemplate, JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.restTemplate = restTemplate;
    }

    public ProductSearchResponse searchProducts(DtoQuery dtoQuery) {
        try {


            ResponseEntity<SearchDocument[]> response =
                    restTemplate.postForEntity(
                            searchServiceUrl + "/search",
                            dtoQuery,
                            SearchDocument[].class
                    );


            List<Product> products = new ArrayList<>();

            List<SearchDocument> documentList = Arrays.asList(response.getBody());

            for (int i = 0; i < documentList.size(); i++) {
                UUID curId = UUID.fromString(documentList.get(i).getId());

                Product product = getProductById(curId);

                products.add(product);
            }

            ProductSearchResponse productSearchResponse = new ProductSearchResponse();
            productSearchResponse.setItems(products);
            return productSearchResponse;


        } catch (Exception e) {
            //log.error("Error calling search service", e);
            throw new RuntimeException("Search service unavailable", e);
        }
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

    @Getter
    @ToString
    private static class SearchQuery {
        private String query;
        private Integer cnt;

        private SearchQuery(String query, Integer limit) {
            this.query = query;
            this.cnt = limit;
        }
    }
}