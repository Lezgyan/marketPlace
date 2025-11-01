package com.MarketPlace.SearchEngineES;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.*;
import co.elastic.clients.elasticsearch.indices.*;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import com.MarketPlace.SearchEngineES.dto.Document;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;

import java.io.IOException;
import java.io.StringReader;
import java.util.List;
import java.util.stream.Collectors;

public class ElasticsearchClientDocker {

    private final ElasticsearchClient client;

    public ElasticsearchClientDocker() {
        RestClient restClient = RestClient.builder(
                new HttpHost("localhost", 9200, "http")
        ).build();

        ObjectMapper objectMapper = new ObjectMapper();

        objectMapper.registerModule(new JavaTimeModule());

        JacksonJsonpMapper jacksonJsonpMapper = new JacksonJsonpMapper(objectMapper);
        ElasticsearchTransport transport = new RestClientTransport(
                restClient, jacksonJsonpMapper
        );

        this.client = new ElasticsearchClient(transport);
    }


    public void createSearchIndex(String indexName) throws IOException {
        String settingsSearch = """
                {
                  "settings": {
                    "index": {
                      "mapping": {
                        "total_fields": {
                          "limit": 10000
                        }
                      }
                    },
                    "analysis": {
                      "filter": {
                        "ru_stopwords": {
                          "type": "stop",
                          "stopwords": "а,без,более,бы,был,была,были,было,быть,в,вам,вас,весь,во,вот,все,всего,всех,вы,где,да,даже,для,до,его,ее,если,есть,еще,же,за,здесь,и,из,или,им,их,к,как,ко,когда,кто,ли,либо,мне,может,мы,на,надо,наш,не,него,нее,нет,ни,них,но,ну,о,об,однако,он,она,они,оно,от,очень,по,под,при,с,со,так,также,такой,там,те,тем,то,того,тоже,той,только,том,ты,у,уже,хотя,чего,чей,чем,что,чтобы,чье,чья,эта,эти,это,я,a,an,and,are,as,at,be,but,by,for,if,in,into,is,it,no,not,of,on,or,such,that,the,their,then,there,these,they,this,to,was,will,with"
                        },
                        "search_synonym": {
                          "type": "synonym",
                          "synonyms_path": "analysis/synonyms.txt"
                        },
                        "russian_morphology": {
                          "type": "stemmer",
                          "language": "russian"
                        }
                      },
                      "analyzer": {
                        "my_search_analyzer": {
                          "type": "custom",
                          "tokenizer": "standard",
                          "filter": [
                            "lowercase",
                            "ru_stopwords",
                            "search_synonym",
                            "russian_morphology"
                          ]
                        }
                      }
                    }
                  },
                  "mappings": {
                    "properties": {
                      "name": {
                        "type": "text",
                        "analyzer": "my_search_analyzer",
                        "fields": {
                          "keyword": {
                            "type": "keyword"
                          }
                        }
                      },
                      "price": {
                        "type": "float"
                      },
                      "text": {
                        "type": "text",
                        "analyzer": "my_search_analyzer"
                      },
                      "currency": {
                        "type": "keyword"
                      }
                    }
                  }
                }
                
                """;


        CreateIndexRequest request = CreateIndexRequest.of(b -> b
                .index(indexName)
                .withJson(new StringReader(settingsSearch))
        );

        client.indices().create(request);

    }

    public List<Document> search(String indexName, String query, Integer cnt) throws IOException {
        SearchResponse<Document> response = client.search(s -> s
                        .index(indexName)
                        .from(0)
                        .size(cnt)
                        .query(q -> q
                                .bool(b -> {
                                    String[] words = query.split("\\s+");
                                    for (String word : words) {
                                        if (!word.trim().isEmpty()) {
                                            b.must(m -> m
                                                    .multiMatch(mm -> mm
                                                            .query(word)
                                                            .fields("name^3", "text")
                                                            .analyzer("my_search_analyzer")
                                                            .fuzziness("AUTO")
                                                    )
                                            );
                                        }
                                    }
                                    return b;
                                })
                        ),
                Document.class
        );

        return response.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }


    public void bulkIndexDocuments(String indexName, List<Document> documents) throws IOException {
        final int BATCH_SIZE = 300;

        for (int i = 0; i < documents.size(); i += BATCH_SIZE) {
            int end = Math.min(documents.size(), i + BATCH_SIZE);
            List<Document> batch = documents.subList(i, end);

            BulkRequest.Builder br = new BulkRequest.Builder();

            for (Document doc : batch) {
                br.operations(op -> op
                        .index(idx -> idx
                                .index(indexName)
                                .id(doc.getId().toString())
                                .document(doc)
                        )
                );
            }

            BulkResponse response = client.bulk(br.build());

            if (response.errors()) {
                System.err.println("Ошибки в батче " + (i/BATCH_SIZE + 1) + ":");
            }


            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        System.out.println("Всего индексировано документов: " + documents.size());
    }


    public void deleteIndex(String indexName) throws IOException {
        DeleteIndexResponse response = client.indices().delete(d -> d.index(indexName));
        System.out.println("Индекс удален: " + indexName);
    }

    public void close() throws IOException {
        client._transport().close();
    }

    public boolean checkIfIndexExists(String indexName) throws IOException {
        return client.indices().exists(e -> e.index(indexName)).value();
    }
}
