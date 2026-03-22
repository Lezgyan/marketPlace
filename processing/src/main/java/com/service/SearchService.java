package com.service;

import com.client.RankerGrpcClient;
import com.dto.*;
import com.example.ranker.grpc.RankItem;
import com.example.ranker.grpc.RankRequest;
import com.example.ranker.grpc.RankResponse;
import com.example.ranker.grpc.RankResult;
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

    private final RankerGrpcClient rankerGrpcClient;

    private final String SEARCH_SERVICE_URL = "http://localhost:8085";

    private final Integer COUNT_PRODUCTS_PAGE  = 20;

    private final boolean FLAG = false;

    private final ObjectMapper objectMapper;

    public SearchService(ProductDao productDao, RestTemplate restTemplate, DBProducts dbProducts, RedisStorageService redisStorageService, RankerGrpcClient rankerGrpcClient, ObjectMapper objectMapper) {
        this.productDao = productDao;
        this.restTemplate = restTemplate;
        this.dbProducts = dbProducts;
        this.redisStorageService = redisStorageService;
        this.rankerGrpcClient = rankerGrpcClient;
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


                if (FLAG) {
                    List<SearchDocument> documentList = Arrays.asList(response.getBody());

                    RankRequest.Builder rankRequestBuilder = RankRequest.newBuilder()
                            .setQuery(dtoQuery.query())
                            .setTopK(documentList.size());

                    for (SearchDocument doc : documentList) {
                        RankItem.Builder itemBuilder = RankItem.newBuilder()
                                .setId(doc.getId())
                                .setName(String.valueOf(doc.getPayload().getOrDefault("name", "")))
                                .setText(String.valueOf(doc.getPayload().getOrDefault("text", "")));

                        Object tagsObj = doc.getPayload().get("tags");
                        if (tagsObj instanceof List<?> tagsList) {
                            for (Object tag : tagsList) {
                                if (tag != null) {
                                    itemBuilder.addTags(String.valueOf(tag));
                                }
                            }
                        }

                        rankRequestBuilder.addItems(itemBuilder.build());
                    }

                    RankResponse rankResponse = rankerGrpcClient.rank(rankRequestBuilder.build());

                    for (RankResult result : rankResponse.getResultsList()) {
                        listIds.add(result.getId());
                    }

                } else {
                    for (var it : Objects.requireNonNull(response.getBody())) {
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
            throw new RuntimeException("Search service unavailable", e);
        }
    }

    public Product searchProductById(UUID id){
        return productDao.getProductById(id);
    }
}