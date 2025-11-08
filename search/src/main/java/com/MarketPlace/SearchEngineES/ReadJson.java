package com.MarketPlace.SearchEngineES;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class ReadJson {
    ObjectMapper objectMapper = new ObjectMapper();

    private final static String PATH = "E:\\University\\course_4\\ScriptLP\\marketPlace\\search\\src\\main\\resources\\data\\documents_list.json";

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
