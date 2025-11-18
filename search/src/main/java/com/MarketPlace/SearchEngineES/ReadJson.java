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

<<<<<<< HEAD
    private final static String PATH = "C:\\Users\\ddeni\\Downloads\\anotherM\\marketPlace\\search\\src\\main\\resources\\data\\documents_list.json";
=======
    private final static String PATH = "E:\\University\\course_4\\ScriptLP\\marketPlace\\search\\src\\main\\resources\\data\\documents_list.json";
>>>>>>> 0cea0712abe133a0e4f241097fbdb377533295c8

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
