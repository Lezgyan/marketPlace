package com.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Map;

@Valid
public record DtoQuery(
        @NotBlank
        String query,

//        @Min(1)
//        @NotNull
//        Integer cnt,

        @Min(0)
        @NotNull
        Integer numberOfPage,

//        @Min(1)
//        @NotNull
//        Integer countOfProductsOnPage,

        @Min(0)
        @NotNull
        BigDecimal priceFrom,

        @Min(0)
        @NotNull
        BigDecimal priceTo,

        Map<String, Object> payload
) {
}