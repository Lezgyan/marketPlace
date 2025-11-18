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
<<<<<<< HEAD
    private final String INDEX_NAME = "search-documents_smth_smth";
=======
    private final String INDEX_NAME = "search-documents";
>>>>>>> 0cea0712abe133a0e4f241097fbdb377533295c8

    public List<Document> getDocumentList(DtoQuery dtoQuery) throws IOException {
        var a = esClient.search(INDEX_NAME, dtoQuery.query(), dtoQuery.cnt());
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

                Document document = new Document(id, text, name, tags.toArray(String[]::new));
                documents.add(document);
            }

            esClient.bulkIndexDocuments(INDEX_NAME, documents);

        }
    }
}

