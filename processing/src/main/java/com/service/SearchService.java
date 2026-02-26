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

import java.util.*;

@Slf4j
@Service
public class SearchService {


    private final ProductDao productDao;

    private final RestTemplate restTemplate;

    private final DBProducts dbProducts;

    private final RedisStorageService redisStorageService;

    private final String SEARCH_SERVICE_URL = "http://localhost:8085";

    private final Integer COUNT_PRODUCTS_PAGE  = 20;

    private final ObjectMapper objectMapper;

    public SearchService(ProductDao productDao, RestTemplate restTemplate, DBProducts dbProducts, RedisStorageService redisStorageService, ObjectMapper objectMapper) {
        this.productDao = productDao;
        this.restTemplate = restTemplate;
        this.dbProducts = dbProducts;
        this.redisStorageService = redisStorageService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void prepareDB() throws Exception {
        if (productDao.isTableEmpty()){
            dbProducts.importProducts();
        }
    }

    public ProductSearchResponse searchProducts(DtoQuery dtoQuery) {
        try {

            String key = dtoQuery.query() + dtoQuery.payload().toString() + dtoQuery.priceFrom() + dtoQuery.priceTo();

            DtoRedis dataFromRedis = redisStorageService.takeRedis(key);

            List<String> listIds = new ArrayList<>();

            if (dataFromRedis != null && dataFromRedis.getValue() != null){
                JsonNode jsonNode = dataFromRedis.getValue().path("id");
                if (jsonNode.isArray()){
                    for (var it : jsonNode){
                        listIds.add(it.asText());
                    }
                }
                redisStorageService.expireTTL(key);
                System.out.println("ДАННЫЕ ИЗ REDIS");
            } else {
                ResponseEntity<SearchDocument[]> response =
                        restTemplate.postForEntity(
                                SEARCH_SERVICE_URL + "/search",
                                dtoQuery,
                                SearchDocument[].class
                        );

                for (var it : Objects.requireNonNull(response.getBody())){
                    listIds.add(it.getId());
                }

                Map<String, Object> payload = new HashMap<>();
                payload.put("query", dtoQuery.query());
                payload.put("id", listIds);


                JsonNode valueNode = objectMapper.valueToTree(payload);
                DtoRedis dto = new DtoRedis(key, valueNode);

                redisStorageService.putRedis(dto);

                System.out.println("ДАННЫЕ ИЗ ELASTICSEARCH");
            }

            List<Product> products = new ArrayList<>();

            for (int i = COUNT_PRODUCTS_PAGE * dtoQuery.numberOfPage(); i < Math.min(listIds.size(), COUNT_PRODUCTS_PAGE * (dtoQuery.numberOfPage() + 1)); i++) {
                UUID curId = UUID.fromString(listIds.get(i));

                Product product = productDao.getProductById(curId);

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

    public Product searchProductById(UUID id){
        return productDao.getProductById(id);
    }
}