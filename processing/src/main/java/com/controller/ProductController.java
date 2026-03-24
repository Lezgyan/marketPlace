package com.controller;

import com.dto.DtoQuery;
import com.dto.Product;
import com.dto.ProductSearchResponse;
import com.service.SearchService;
import com.service.SendProductsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/products")
public class ProductController {


    private final SendProductsService sendProductsService;

    private final SearchService searchService;

    public ProductController(SendProductsService sendProductsService, SearchService searchService) {
        this.sendProductsService = sendProductsService;
        this.searchService = searchService;
    }


    @GetMapping
    public ResponseEntity<ProductSearchResponse> getProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String view,
            @RequestParam(required = false) Integer numberOfPage
    ) {
        ProductSearchResponse response;

        if ("startPage".equalsIgnoreCase(view)) {
            response = sendProductsService.getSerialProductsForStartPage();
        } else {
            response = searchService.searchProducts(
                    new DtoQuery(
                            query,
                            numberOfPage,
                            null,
                            null,
                            null
                    )
            );
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        UUID uuid = searchService.createProduct(product);
        URI location = URI.create("/products/" + uuid);
        return ResponseEntity.created(location).body(null);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable UUID id,
            @RequestBody Product product
    ) {
        searchService.updateProduct(id, product);
        return ResponseEntity.ok(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        searchService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable UUID id) {
        Product product = searchService.searchProductById(id);
        return ResponseEntity.ok(product);
    }

    @PostMapping("/search")
    public ResponseEntity<ProductSearchResponse> searchProducts(@RequestBody DtoQuery dtoQuery) {

        ProductSearchResponse response = searchService.searchProducts(dtoQuery);
        return ResponseEntity.ok(response);
    }
}