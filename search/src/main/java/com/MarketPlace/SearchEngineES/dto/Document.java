package com.MarketPlace.SearchEngineES.dto;

public class Document {
    private Long id;

    private String text;

    private String name;

    private String[] tags;

    public Document() {

    }

    public Document(Long id, String text, String name, String[] tags) {
        this.id = id;
        this.text = text;
        this.name = name;
        this.tags = tags;
    }

    public Long getId() {
        return id;
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