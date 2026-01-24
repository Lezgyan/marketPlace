package com.controller;

import com.dto.DtoQuery;
import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.repository.ProductDao;
import com.service.SearchService;
import com.service.SendProductsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/products")
public class ProductController {


    private final SendProductsService sendProductsService;

    private final SearchService searchService;

    public ProductController(SendProductsService sendProductsService, SearchService searchService) {
        this.sendProductsService = sendProductsService;
        this.searchService = searchService;
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchProducts(@RequestBody(required = false) DtoQuery dtoQuery) {

        ProductSearchResponse response = searchService.searchProducts(dtoQuery);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable  java.util.UUID id) {
        Product product = searchService.searchProductById(id);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/startPage")
    public ResponseEntity<?> getSerialProducts(){
        ProductSearchResponse response = sendProductsService.getSerialProductsForStartPage();

        return ResponseEntity.ok(response);
    }

}