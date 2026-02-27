package com.service;

import com.dto.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.repository.ProductDao;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.el.stream.Stream;
import org.springframework.data.relational.core.sql.In;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FavoriteService {
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;
    private final ProductDao productDao;
    private final SearchService searchService;

    public FavoriteService(RestTemplate restTemplate, JdbcTemplate jdbcTemplate, ProductDao pd, SearchService s) {
        this.restTemplate = restTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.productDao = pd;
        this.searchService = s;
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
    public void deleteFavorite(Favorite favorite) {
        String sql = """
            DELETE FROM favorites
            WHERE userId = ? AND productId = ?
            """;


        jdbcTemplate.update(sql, favorite.getUserId(), favorite.getProductId());
    }
    public ProductSearchResponse findFavorites(Integer userId){
        String sql = "SELECT productId FROM favorites WHERE userId = ?";
        List<UUID> ids = jdbcTemplate.queryForList(sql,UUID.class, userId);
        List<Product> products = new ArrayList<>();

        for (int i = 0; i < ids.size(); i++) {
            UUID curId = ids.get(i);

            Product product = productDao.getProductById(curId);

            products.add(product);
        }

        ProductSearchResponse productSearchResponse = new ProductSearchResponse();
        productSearchResponse.setItems(products);
        return productSearchResponse;
    }

    public ProductSearchResponse recommendByFavorites(FavoriteQuery fq){
        ProductSearchResponse favorites = findFavorites(fq.userId);
        List<Product> recentFavorites = favorites.getItems();
        int startIndex = Math.max(0, recentFavorites.size() - fq.limit);
        recentFavorites = recentFavorites.subList(startIndex,recentFavorites.size());
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Integer> uniqueTags = new HashMap<>();
        for (int i = 0;i < recentFavorites.size();i++){
            try {
                JsonNode rootNode = recentFavorites.get(i).getDataRow();
                JsonNode tagsNode = rootNode.get("tags");

                List<String> tags = objectMapper.convertValue(tagsNode, new TypeReference<List<String>>() {});

                for(var tag: tags){
                    uniqueTags.put(tag, uniqueTags.getOrDefault(tag,0) + 1);
                }

            } catch (Exception e) {
                e.printStackTrace();

            }
        }
        List<String> topTags = uniqueTags.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        String sql = """
        WITH user_favorites AS (
            SELECT productId FROM favorites WHERE userId = ?
        )
        SELECT DISTINCT p.id, p.name, p.raw_data,
               COUNT(t.tag) as matching_tags
        FROM products p
        CROSS JOIN LATERAL jsonb_array_elements_text(p.raw_data->'tags') AS t(tag)
        WHERE t.tag IN (%s)
          AND p.id NOT IN (SELECT productId FROM user_favorites)
        GROUP BY p.id, p.name, p.raw_data
        ORDER BY matching_tags DESC
        LIMIT ?
        """;
        String inClause = topTags.stream()
                .map(tag -> "?")
                .collect(Collectors.joining(","));

        sql = String.format(sql, inClause);

        List<Object> params = new ArrayList<>();
        params.add(fq.userId);
        params.addAll(topTags);
        params.add(fq.limit);
        List<Product> products = jdbcTemplate.query(sql, params.toArray(), (rs, rowNum) -> {
            UUID id = UUID.fromString(rs.getString("id"));
            String name = rs.getString("name");

            JsonNode dataRow;
            try {
                dataRow = objectMapper.readTree(rs.getString("raw_data"));
            } catch (Exception e) {

                dataRow = objectMapper.createObjectNode();
            }

            return new Product(id, name, dataRow);
        });

        ProductSearchResponse response = new ProductSearchResponse();
        response.setItems(products);

        return response;
    }
}
