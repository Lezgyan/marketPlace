// PriceChangeProducer.java
package com.service;

import com.dto.PriceChangeEvent;
import com.dto.Product;

import com.repository.ProductDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.fasterxml.jackson.databind.JsonNode;
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceChangeProducer {

    @Autowired
    private ProductDao productDao;

    @Autowired
    private KafkaTemplate<String, PriceChangeEvent> kafkaTemplate;

    @Value("${kafka.topic.price-change:price-change-topic}")
    private String topic;

    public void sendPriceChangeEvent(PriceChangeEvent event) {
        log.info("Отправка события об изменении цены: {}", event);
        kafkaTemplate.send(topic, event.getUrl(), event);
        log.info("Событие успешно отправлено в топик: {}", topic);
    }

    private void checkRandomPrice(PriceChangeEvent event){
        Product rp = productDao.getRandomProduct(77);
        JsonNode root = rp.getDataRow();
        String url = root.path("url").asText();
        String mark = detectMarketplaceFromUrl(url);

        Double currentPrice = root.path("price").asDouble();
        Double actualPrice = scrapeCurrentPrice(url);
        if (currentPrice != actualPrice){
            PriceChangeEvent changedPrice = new PriceChangeEvent(
                    rp.getId(),
                    url,
                    mark,
                    currentPrice,
                    actualPrice
            );
        }
    }

    private String detectMarketplaceFromUrl(String url) {
        if (url == null) return "UNKNOWN";

        if (url.contains("wildberries.ru")) {
            return "WILDBERRIES";
        } else if (url.contains("market.yandex.ru") || url.contains("market.yandex.com")) {
            return "YANDEX_MARKET";
        } else {
            return "UNKNOWN";
        }
    }

    private Double toDoublePrice(String raw) {
        if (raw == null || raw.isEmpty()) {
            return null;
        }

        Pattern PRICE_NUM_RE = Pattern.compile("[\\d\\s\\u00A0]+[.,]?\\d*");

        String s = raw.strip()
                .replace("\u00A0", " ")   // неразрывный пробел
                .replace("\u2006", " ")   // узкий пробел
                .replace(" ", " ");       // тонкий пробел

        Matcher matcher = PRICE_NUM_RE.matcher(s);

        if (!matcher.find()) {

            return null;
        }

        String num = matcher.group(0)
                .replace(" ", "")
                .replace(",", ".");

        try {
            return Double.parseDouble(num);
        } catch (NumberFormatException e) {

            return null;
        }
    }

    private Double scrapeCurrentPrice(String url) {
        WebDriver driver = null;

        try {
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--headless");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--disable-gpu");
            options.addArguments("--window-size=1920,1080");

            driver = new ChromeDriver(options);
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(10));
            driver.get(url);

            Thread.sleep(2000);

            String xpath1 = "//*[@id=\"/content/page/fancyPage/defaultPage/mainDO/price/price\"]/div/div[1]/div/div[1]/span/span[1]";
            String xpath2 = "//*[@id=\"/content/page/fancyPage/defaultPage/mainDO/price/price\"]/div/div[1]/div/div[1]/button/span/span[1]";

            WebElement priceElement = null;
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            try {
                priceElement = wait.until(
                        ExpectedConditions.presenceOfElementLocated(By.xpath(xpath1))
                );
            } catch (TimeoutException e) {
                priceElement = wait.until(
                        ExpectedConditions.presenceOfElementLocated(By.xpath(xpath2))
                );
            }
            String priceText = priceElement.getText();
            return toDoublePrice(priceText);



        } catch (Exception e) {
            log.error("Ошибка при скрапинге URL: {}", url, e);
            return null;

        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
    }

    public void sendPriceChangeEventAsync(PriceChangeEvent event) {
        kafkaTemplate.send(topic, event.getUrl(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Событие отправлено. Offset: {}, Partition: {}",
                                result.getRecordMetadata().offset(),
                                result.getRecordMetadata().partition());
                    } else {
                        log.error("Ошибка отправки события", ex);
                    }
                });
    }
}