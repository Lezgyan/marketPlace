import pytest
import time
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_product_page_loads_correctly(driver, api_base_url):
    response = requests.post(f"{api_base_url}/products/search",
                             json={"query": "ноутбук", "numberOfPage": 1, "priceFrom": 0, "priceTo": 100000,
                                   "payload": {}},
                             timeout=10)
    assert response.status_code == 200
    items = response.json().get('items', [])
    product_id = items[0]['id'] if items else pytest.skip("Нет товаров")

    driver.get(f"http://localhost:3000/product/{product_id}")
    wait = WebDriverWait(driver, 15)

    wait.until(lambda d: "/product/" in d.current_url)
    time.sleep(2)  # React рендер

    h1 = driver.find_element(By.TAG_NAME, "h1")
    assert h1.text.strip(), "h1 пустой!"

    price = driver.find_elements(By.XPATH, "//p[contains(@style, '32px') or contains(@style, 'bold')]")
    price_text = price[0].text.strip() if price else "НЕ НАЙДЕНА"

    print(f"Товар: {h1.text[:40]} | Цена: {price_text}")


def test_product_error_states(driver):
    driver.get("http://localhost:3000/product/999999")
    wait = WebDriverWait(driver, 10)

    error_h1 = wait.until(EC.any_of(
        EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Не удалось"),
        EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Товар не найден")
    ))
    print("Error state OK")


def test_product_gallery(driver, api_base_url):
    response = requests.post(f"{api_base_url}/products/search",
                             json={"query": "ноутбук", "numberOfPage": 1, "payload": {}}, timeout=10)
    product_id = response.json()['items'][0]['id']

    driver.get(f"http://localhost:3000/product/{product_id}")
    wait = WebDriverWait(driver, 10)

    images = driver.find_elements(By.TAG_NAME, "img")
    assert len(images) > 0, "Нет изображений!"
    print(f"Изображений: {len(images)}")

    buttons = driver.find_elements(By.XPATH, "//button[contains(@style, 'absolute')]")
    print(f"Галерея кнопок: {len(buttons)}")


def test_search_to_product_e2e(driver):
    driver.get("http://localhost:3000/search")
    wait = WebDriverWait(driver, 20)

    search_input = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[placeholder*="название"]')))
    search_input.clear()
    search_input.send_keys("ноутбук")
    time.sleep(5)

    cards = driver.find_elements(By.CSS_SELECTOR, 'div[style*="border"], div[style*="250px"]')
    assert len(cards) > 0, "Карточки не найдены!"

    cards[0].click()
    time.sleep(2)

    h1 = driver.find_element(By.TAG_NAME, "h1")
    assert h1.text.strip()
    print(f"E2E: {h1.text[:40]}")


def test_product_back_button(driver):
    driver.get("http://localhost:3000/search")
    wait = WebDriverWait(driver, 20)

    search_input = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[placeholder*="название"]')))
    search_input.send_keys("ноутбук")
    time.sleep(5)

    cards = driver.find_elements(By.CSS_SELECTOR, 'div[style*="border"]')
    if cards:
        cards[0].click()
        time.sleep(2)

        back_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Назад')]")
        if back_btns:
            current_url = driver.current_url
            back_btns[0].click()
            time.sleep(1)
            assert driver.current_url != current_url
            print("Кнопка Назад OK")
        else:
            print("Нет кнопки Назад — OK")
    else:
        pytest.skip("Нет карточек")
