package com.service;

import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.repository.ProductDao;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class SendProductsService {
    private final ProductDao productDao;

    private final int LIMIT = 20; // количество товаров в выборке

    public SendProductsService(ProductDao productDao) {
        this.productDao = productDao;
    }

    public ProductSearchResponse getSerialProductsForStartPage(){

        int numberProduct = productDao.numberProducts();

        if (numberProduct < LIMIT){
            throw new RuntimeException("Number of Products is too small: " + numberProduct);
        }

        int offset = 0;

        List<Product> productList = new ArrayList<>();
        for (int i = 0; i < LIMIT; i++){
            offset = ThreadLocalRandom.current().nextInt(numberProduct - 1);
            Product product = productDao.getRandomProduct(offset);
            productList.add(product);
        }

        ProductSearchResponse productSearchResponse = new ProductSearchResponse();
        productSearchResponse.setItems(productList);
        return productSearchResponse;

    }
}
