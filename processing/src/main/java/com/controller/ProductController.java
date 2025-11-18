package com.controller;

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
//@RequiredArgsConstructor
public class ProductController {

    private final SearchService searchService;

    @Autowired
    public ProductController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(
            @RequestParam String q,
            @RequestParam(required = false, defaultValue = "20")
            @Min(1) @Max(100) Integer limit) {

        //throw new RuntimeException("ti lox");

        ProductSearchResponse response = searchService.searchProducts(q, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Product product = searchService.getProductById(id);
        return ResponseEntity.ok(product);
    }
}