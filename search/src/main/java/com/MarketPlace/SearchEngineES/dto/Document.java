package com.MarketPlace.SearchEngineES.dto;

import java.util.Map;

public class Document {
    private String id;

    private String text;

    private String name;

    private String[] tags;

    private Map<String, Object> payload;

    public Document() {

    }

    public Document(String id, String text, String name, String[] tags, Map<String, Object> payload) {
        this.id = id;
        this.text = text;
        this.name = name;
        this.tags = tags;
        this.payload = payload;
    }

    public String getId() {
        return id;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public String getName() {
        return this.name;
    }

    public String getText() {
        return this.text;
    }

    public String[] getTags(){ return this.tags; }

    public void setName(String name) {
        this.name = name;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setTags(String[] tags) { this.tags = tags; }


    @Override
    public String toString() {
        return "Document{" +
                "id=" + id +
                ", name='" + getName() + '\'' +
                ", text='" + (getText() != null ? getText().substring(0, Math.min(50, getText().length())) + "..." : "null") + '\'' +
                '}';
    }
}