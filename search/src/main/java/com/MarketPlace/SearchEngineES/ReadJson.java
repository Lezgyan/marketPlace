package com.MarketPlace.SearchEngineES;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class ReadJson {
    ObjectMapper objectMapper = new ObjectMapper();

    private final static String PATH = "C:\\Users\\ddeni\\Downloads\\mark\\marketPlace\\processing\\src\\main\\resources\\data\\products.json";

    public List<Map<String, Object>> readJson() {

        try {
            List<Map<String, Object>> mapList = objectMapper.readValue(
                    new File(PATH),
                    new TypeReference<>() {
                    }
            );
            return mapList;
        }
        catch (IOException e){
            System.out.println(e);
        }
        return null;
    }


}
