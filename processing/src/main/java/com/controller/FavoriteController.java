package com.controller;

import com.dto.Favorite;
import com.dto.FavoriteQuery;
import com.dto.ProductSearchResponse;
import com.service.FavoriteService;
import com.service.SearchService;
import com.service.SendProductsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/products")
public class FavoriteController {

    private final SearchService searchService;
    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService, SearchService searchService) {
        this.favoriteService = favoriteService;
        this.searchService = searchService;
    }

    @PostMapping("/favorite")
    public ResponseEntity<?> addFavoriteProduct(@RequestBody Favorite fav) {
        favoriteService.addFavorite(fav);

        return ResponseEntity.ok().build();
    }
    @PostMapping("/unfavorite")
    public ResponseEntity<?> deleteFavoriteProduct(@RequestBody Favorite fav) {
        favoriteService.deleteFavorite(fav);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recomendFavoriteProduct(@RequestBody FavoriteQuery fq) {
        ProductSearchResponse response = favoriteService.recommendByFavorites(fq);

        return ResponseEntity.ok(response);
    }

}
