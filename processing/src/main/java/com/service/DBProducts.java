package com.service;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class DBProducts {
    private final JdbcTemplate jdbcTemplate;

    public DBProducts(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void importProducts() throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        JsonFactory factory = mapper.getFactory();
        File file = Paths.get("E:\\University\\course_4\\ScriptLP\\marketPlace\\processing\\src\\main\\resources\\data\\products.json").toFile();

        try (JsonParser parser = factory.createParser(file)) {

            if (parser.nextToken() != JsonToken.START_ARRAY) {
                throw new IllegalStateException("Ожидается JSON массив");
            }

            List<Object[]> batchArgs = new ArrayList<>();
            final int BATCH_LIMIT = 1000;

            while (parser.nextToken() == JsonToken.START_OBJECT) {

                JsonNode node = mapper.readTree(parser);

                UUID id = UUID.fromString(node.path("id").asText());

                String name = node.path("name").asText(null);

                String rawJson = node.toString();

                batchArgs.add(new Object[]{id, name, rawJson});

                if (batchArgs.size() >= BATCH_LIMIT) {
                    saveBatch(batchArgs);
                    batchArgs.clear();
                }
            }

            if (!batchArgs.isEmpty()) {
                saveBatch(batchArgs);
            }
        }
    }

    private void saveBatch(List<Object[]> batchArgs) {
        String sql = """
        INSERT INTO products (id, name, raw_data)
        VALUES (?, ?, ?::jsonb)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            raw_data = EXCLUDED.raw_data
        """;

        jdbcTemplate.batchUpdate(sql, batchArgs);
    }
}
