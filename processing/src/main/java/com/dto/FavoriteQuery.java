package com.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
public class FavoriteQuery {
    @NotNull
    public Integer userId;

    @Min(1)
    @NotNull
    public Integer limit;

}
