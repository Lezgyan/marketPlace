package com.MarketPlace.SearchEngineES.dto;

public class Document {
    private Long id;

    private String text;

    private String name;

    public Document() {

    }

    public Document(Long id, String text, String name) {
        this.id = id;
        this.text = text;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getName() {
        return this.name;
    }

    public String getText() {
        return this.text;
    }

    @Override
    public String toString() {
        return "Document{" +
                "id=" + id +
                ", name='" + getName() + '\'' +
                ", text='" + (getText() != null ? getText().substring(0, Math.min(50, getText().length())) + "..." : "null") + '\'' +
                '}';
    }
}