package com.dto;

import lombok.Data;

@Data
public class SearchDocument {
    private String id;
    private String text;
    private String name;
    private String[] tags;
    
    // Конструкторы
    public SearchDocument() {}
    
    public SearchDocument(String id, String text, String name, String[] tags) {
        this.id = id;
        this.text = text;
        this.name = name;
        this.tags = tags;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getText() {
        return text;
    }

    public String[] getTags() {
        return tags;
    }
}