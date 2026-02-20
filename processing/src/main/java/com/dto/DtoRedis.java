package com.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@AllArgsConstructor
public class DtoRedis {
    public JsonNode getValue() {
        return value;
    }
    public String getKey() {
        return key;
    }


    private String key;

    private JsonNode value;

}
