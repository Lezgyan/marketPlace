package com.MarketPlace.SearchEngineES;


import com.MarketPlace.SearchEngineES.dto.Document;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

public class SearchEngine {

    public static void main(String[] args) {
        ElasticsearchClientDocker esClient = new ElasticsearchClientDocker();
        Scanner scanner = new Scanner(System.in);

        try {

            String indexName = "search-documents";

            if (!esClient.checkIfIndexExists(indexName)) {
                esClient.createSearchIndex(indexName);


                ReadJson readJson = new ReadJson();

                List<Map<String, Object>> mapList = readJson.readJson();

                List<Document> documents = new ArrayList<>();

                Long id = 1L;

                for (Map<String, Object> item : mapList) {
                    String name = (String) item.get("name");
                    String text = (String) item.get("text");

                    Document document = new Document(id, text, name);
                    documents.add(document);
                    id++;
                }

                esClient.bulkIndexDocuments(indexName, documents);

                Thread.sleep(1000);
            }

            while (true) {

                System.out.println("Введите запрос: ");
                String q = scanner.nextLine();
                System.out.println("Введите размер выборки: ");
                Integer cnt = Integer.parseInt(scanner.nextLine());

                List<Document> results = esClient.search(indexName, q, cnt);

                for (Document document : results) {
                    System.out.println(document);
                }
            }


        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                esClient.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
