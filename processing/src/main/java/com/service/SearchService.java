package com.service;

import com.dto.DtoQuery;
import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.dto.SearchDocument;
import com.repository.ProductDao;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class SearchService {


    private final ProductDao productDao;

    private final RestTemplate restTemplate;

    private final DBProducts dbProducts;

    private final String SEARCH_SERVICE_URL = "http://localhost:8085";

    public SearchService(ProductDao productDao, RestTemplate restTemplate, DBProducts dbProducts) {
        this.productDao = productDao;
        this.restTemplate = restTemplate;
        this.dbProducts = dbProducts;
    }

    @PostConstruct
    public void prepareDB() throws Exception {
        if (productDao.isTableEmpty()){
            dbProducts.importProducts();
        }
    }

    public ProductSearchResponse searchProducts(DtoQuery dtoQuery) {
        try {

            ResponseEntity<SearchDocument[]> response =
                    restTemplate.postForEntity(
                            SEARCH_SERVICE_URL + "/search",
                            dtoQuery,
                            SearchDocument[].class
                    );


            List<Product> products = new ArrayList<>();

            List<SearchDocument> documentList = Arrays.asList(response.getBody());

            for (int i = 0; i < documentList.size(); i++) {
                UUID curId = UUID.fromString(documentList.get(i).getId());

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