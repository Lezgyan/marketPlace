// PriceChangeConsumer.java
package com.service;

import com.dto.PriceChangeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceChangeConsumer {

    @Autowired
    private PriceUpdateService priceUpdateService;

    @KafkaListener(
            topics = "${kafka.topic.price-change:price-change-topic}",
            groupId = "${spring.kafka.consumer.group-id:processing}"
    )
    public void handlePriceChange(PriceChangeEvent event) {
        log.info("Получено событие об изменении цены: {}", event);

        try {
            priceUpdateService.updateProductPrice(
                    event.getId(),
                    event.getUrl(),
                    event.getMarket(),
                    event.getNewPrice()
            );

            log.info("Цена обновлена для товара: {}", event.getUrl());

        } catch (Exception e) {
            log.error("Ошибка при обработке события об изменении цены", e);

        }
    }



}