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

    private final String RERANKER_SERVICE_URL = "http://localhost:5000";

    private final Integer COUNT_PRODUCTS_PAGE  = 20;

    private final boolean FLAG = false;

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




                if (FLAG){
                    List<SearchDocument> documentList = Arrays.asList(response.getBody());


                    Map<String, Object> rankReq = new HashMap<>();
                    rankReq.put("query", dtoQuery.query());
                    rankReq.put("top_k", documentList.size());

                    List<Map<String, Object>> items = new ArrayList<>();
                    for (SearchDocument doc : documentList) {
                        Map<String, Object> it = new HashMap<>();
                        it.put("id", doc.getId());
                        it.put("name", doc.getPayload().get("name"));
                        it.put("text", doc.getPayload().get("text"));
                        it.put("tags", doc.getPayload().get("tags"));
                        items.add(it);
                    }
                    rankReq.put("items", items);

                    ResponseEntity<Map> rankResp = restTemplate.postForEntity(
                            RERANKER_SERVICE_URL + "/rank",
                            rankReq,
                            Map.class
                    );

                    List<Map<String, Object>> results =
                            (List<Map<String, Object>>) rankResp.getBody().get("results");


                    for (Map<String, Object> r : results) {
                        String id = String.valueOf(r.get("id"));
                        listIds.add(id);
                    }

                } else {
                    for (var it : Objects.requireNonNull(response.getBody())){
                        listIds.add(it.getId());
                    }
                }

                Map<String, Object> payload = new HashMap<>();
                payload.put("query", dtoQuery.query());
                payload.put("id", listIds);


                JsonNode valueNode = objectMapper.valueToTree(payload);
                DtoRedis dto = new DtoRedis(key, valueNode);

                redisStorageService.putRedis(dto);

                System.out.println("ДАННЫЕ ИЗ ELASTICSEARCH");
            }

            List<UUID> idProducts = new ArrayList<>();

            for (int i = COUNT_PRODUCTS_PAGE * dtoQuery.numberOfPage(); i < Math.min(listIds.size(), COUNT_PRODUCTS_PAGE * (dtoQuery.numberOfPage() + 1)); i++) {
                idProducts.add(UUID.fromString(listIds.get(i)));
            }

            List<Product> products = productDao.getProductByListIds(idProducts);

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