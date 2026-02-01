package com.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class Product {
    private UUID id;

    private String name;

    private JsonNode dataRow;

    public Product(UUID id, String name, JsonNode dataRow) {
        this.id = id;
        this.name = name;
        this.dataRow = dataRow;
    }



    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public JsonNode getDataRow() {
        return dataRow;
    }


}