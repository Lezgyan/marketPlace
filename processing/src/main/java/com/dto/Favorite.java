package com.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;


public class Favorite {

    @NotNull
    private Integer userId;

    @NotNull
    private UUID productId;


    public Favorite() {}

    public Favorite(Integer userId, UUID productId) {
        this.userId = userId;
        this.productId = productId;
    }


    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }
}