package com.MarketPlace.SearchEngineES;


import com.MarketPlace.SearchEngineES.dto.Document;
import com.MarketPlace.SearchEngineES.dto.DtoQuery;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Service
public class SearchEngine {
    private final ElasticsearchClientDocker esClient = new ElasticsearchClientDocker();
    private final String INDEX_NAME = "test-twenty-seven-search-documents-with-filters";

    public List<Document> getDocumentList(DtoQuery dtoQuery) throws IOException {
        List<Document> a = new ArrayList<>();
        try {
            a = esClient.search(INDEX_NAME, dtoQuery.query(), dtoQuery.payload());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return a;
    }

    @PostConstruct
    public void startEngine() throws IOException {

        if (!esClient.checkIfIndexExists(INDEX_NAME)) {
            esClient.createSearchIndex(INDEX_NAME);

            ReadJson readJson = new ReadJson();

            List<Map<String, Object>> mapList = readJson.readJson();

            List<Document> documents = new ArrayList<>();

            for (Map<String, Object> item : mapList) {
                String id = (String) item.get("id");

                String name = (String) item.get("name");

                String text = (String) item.get("text");

                List<String> tags = (ArrayList<String>) item.get("tags");


                Document document = new Document(id, text, name, tags.toArray(String[]::new), item);
                documents.add(document);
            }
            System.out.println("Start build index");

            esClient.bulkIndexDocuments(INDEX_NAME, documents);

        }
    }
}

