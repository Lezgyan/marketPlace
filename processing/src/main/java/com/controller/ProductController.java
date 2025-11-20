package com.controller;

import com.dto.DtoQuery;
import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final SearchService searchService;

    public ProductController(SearchService searchService) {
        this.searchService = searchService;
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchProducts(@RequestBody(required = false) DtoQuery dtoQuery) {

        ProductSearchResponse response = searchService.searchProducts(dtoQuery);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable  java.util.UUID id) {
        Product product = searchService.getProductById(id);
        return ResponseEntity.ok(product);
    }

}