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

    public Product(UUID id, String name, JsonNode dataRow) {
        this.id = id;
        this.name = name;
        this.dataRow = dataRow;
    }

    private JsonNode dataRow;



    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public JsonNode getDataRow() {
        return dataRow;
    }


//    private String text;
//    private BigDecimal price;
//    private String currency;
//    private List<String> images;
//    private Map<String, Object> attributes;
//
//    public String getId() {
//        return id;
//    }
//
//    public String getName() {
//        return name;
//    }
//
//    public void setId(String id) {
//        this.id = id;
//    }
//
//    public void setName(String name) {
//        this.name = name;
//    }

//    public void setText(String text) {
//        this.text = text;
//    }
//
//    public void setImages(List<String> images) {
//        this.images = images;
//    }
//
//    public void setCurrency(String currency) {
//        this.currency = currency;
//    }
//
//    public void setUrl(String url) {
//        this.url = url;
//    }
//
//    public void setPrice(BigDecimal price) {
//        this.price = price;
//    }
}