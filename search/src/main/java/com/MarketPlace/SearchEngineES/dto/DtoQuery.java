package com.MarketPlace.SearchEngineES.dto;


import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Valid
public record DtoQuery(
        @NotBlank
        String query,

        @Min(1)
        @NotNull
        Integer cnt
) {
}
