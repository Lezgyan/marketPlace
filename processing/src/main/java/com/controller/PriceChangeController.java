// PriceChangeController.java
package com.controller;

import com.dto.PriceChangeEvent;
import com.service.PriceChangeProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/price-changes")
@RequiredArgsConstructor
public class PriceChangeController {

    @Autowired
    private PriceChangeProducer producer;

    @PostMapping("/change")
    public ResponseEntity<String> sendPriceChange(@RequestBody PriceChangeEvent event) {
        producer.sendPriceChangeEvent(event);
        return ResponseEntity.ok("Событие об изменении цены отправлено в Kafka");
    }

    @PostMapping("/test")
    public ResponseEntity<String> sendTestEvent() {
        PriceChangeEvent testEvent = new PriceChangeEvent(
                UUID.fromString("66bf8b24-c96e-4d6d-81ed-9a36fd54496e"),
                "https://marketplace.com/product/123",
                "USA",
                100.0,
                95.0
        );
        producer.sendPriceChangeEvent(testEvent);
        return ResponseEntity.ok("Тестовое событие отправлено");
    }
}