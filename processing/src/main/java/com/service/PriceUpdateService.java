// PriceUpdateService.java
package com.service;

import com.repository.ProductDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceUpdateService {

    @Autowired
    private ProductDao productDao;

    public void updateProductPrice(UUID id, String url, String market, Double newPrice) {
        log.info("Обновление цены продукта {} с номером {} на рынке {}: {}", url, id, market, newPrice);
        productDao.updatePrice(id, newPrice);

    }
}