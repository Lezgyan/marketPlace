package com.dto;

import lombok.Data;

import java.util.Map;

@Data
public class SearchDocument {
    private String id;

    private Map<String, Object> payload;
//    private String text;
//    private String name;
//    private String[] tags;

    public SearchDocument() {}
    
    public SearchDocument(String id, Map<String, Object> payload) {
        this.id = id;
        this.payload = payload;
//        this.text = text;
//        this.name = name;
//        this.tags = tags;
    }

    public String getId() {
        return id;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

//    public String getName() {
//        return name;
//    }
//
//    public String getText() {
//        return text;
//    }
//
//    public String[] getTags() {
//        return tags;
//    }
}