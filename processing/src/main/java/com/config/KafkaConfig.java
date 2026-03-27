// KafkaConfig.java
package com.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;

import java.util.HashMap;
import java.util.Map;

import com.dto.PriceChangeEvent;

@Configuration
public class KafkaConfig {

    // Кастомная фабрика для listener'ов с ручным подтверждением
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PriceChangeEvent>
    kafkaListenerContainerFactory(
            ConsumerFactory<String, PriceChangeEvent> consumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, PriceChangeEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        factory.setConcurrency(3); // Количество потоков-потребителей

        return factory;
    }
}