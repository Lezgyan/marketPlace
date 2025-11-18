package com.service;

import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.dto.SearchDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.Getter;
import lombok.ToString;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
//@RequiredArgsConstructor
public class SearchService {
    private final RestTemplate restTemplate;

//    @Value("${search.service.url:http://localhost:8081}")
    private final String searchServiceUrl = "http://localhost:8085";

    @Autowired
    public SearchService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ProductSearchResponse searchProducts(String query, Integer limit) {
        try {
            int actualLimit = limit != null ? limit : 20;
            SearchQuery searchQuery = new SearchQuery(query, actualLimit);

            //log.info("Calling search service: {}/search with query: {}", searchServiceUrl, searchQuery);

            // Вызываем search сервис через POST запрос
            ResponseEntity<SearchDocument[]> response =
                restTemplate.postForEntity(
                    searchServiceUrl + "/search",
                    searchQuery,
                    SearchDocument[].class
                );

            // Преобразуем SearchDocument в Product
            List<Product> products = Arrays.stream(response.getBody())
                    .map(this::convertToProduct)
                    .collect(Collectors.toList());

            ProductSearchResponse searchResponse = new ProductSearchResponse();
            searchResponse.setItems(products);

            return searchResponse;

        } catch (Exception e) {
            //log.error("Error calling search service", e);
            throw new RuntimeException("Search service unavailable", e);
        }
    }

    public Product getProductById(String id) {
        try {
            // Ищем товар по ID через поисковый сервис
            // Предполагаем, что search сервис может искать по ID
            SearchQuery searchQuery = new SearchQuery("id:" + id, 1);

            ResponseEntity<SearchDocument[]> response =
                restTemplate.postForEntity(
                    searchServiceUrl + "/search",
                    searchQuery,
                    SearchDocument[].class
                );

            if (response.getBody() != null && response.getBody().length > 0) {
                return convertToProduct(response.getBody()[0]);
            } else {
                throw new RuntimeException("Product not found with id: " + id);
            }

        } catch (Exception e) {
            //log.error("Error getting product by id: {}", id, e);
            throw new RuntimeException("Product not found", e);
        }
    }

    private Product convertToProduct(SearchDocument document) {
        Product product = new Product();
        product.setId(document.getId());
        product.setName(document.getName());
        product.setText(document.getText());

        // Генерируем URL на основе ID
        product.setUrl("/products/" + document.getId());

        // Устанавливаем значения по умолчанию
        product.setCurrency("RUB");
        product.setPrice(java.math.BigDecimal.valueOf(0.0));

        // Если в Document есть tags, можно преобразовать в images
        if (document.getTags() != null && document.getTags().length > 0) {
            product.setImages(Arrays.asList(document.getTags()));
        }

        return product;
    }

    // Вспомогательный класс для запроса к search сервису
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