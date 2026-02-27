package com.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductSearchResponse {
    private List<Product> items;

    public List<Product> getItems() {return  this.items;}

    public void setItems(List<Product> items) {
        this.items = items;
    }
}