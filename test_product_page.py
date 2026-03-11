import pytest
import time
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_product_page_loads_correctly(driver, api_base_url):
    try:
        response = requests.post(f"{api_base_url}/products/search",
                                 json={"query": "ноутбук", "cnt": 1}, timeout=5)
        if response.status_code != 200:
            pytest.skip("API недоступен")
        first_product = response.json()['items'][0]
        product_id = first_product['id']
    except:
        pytest.skip("Не удалось получить ID товара из API")

    driver.get(f"http://localhost:3000/product/{product_id}")

    wait = WebDriverWait(driver, 15)
    h1 = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

    assert h1.text.strip(), "Название товара не загрузилось!"
    print(f"✅ Загружен товар: {h1.text}")


def test_product_error_handling(driver):
    driver.get("http://localhost:3000/product/999999")

    wait = WebDriverWait(driver, 10)
    error_states = [
        EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Товар не найден"),
        EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Не удалось загрузить")
    ]

    error_found = False
    for condition in error_states:
        try:
            wait.until(condition)
            error_found = True
            break
        except:
            continue

    assert error_found, "Страница ошибки не отображается!"


def test_navigation_from_search(driver):
    driver.get("http://localhost:3000/search")

    wait = WebDriverWait(driver, 15)
    search_input = wait.until(EC.presence_of_element_located((
        By.CSS_SELECTOR, "input[placeholder*='Введите название']")))

    search_input.clear()
    search_input.send_keys("шапки")
    time.sleep(2)

    cards = wait.until(EC.presence_of_all_elements_located((
        By.CSS_SELECTOR, "div[style*='border: 1px solid #ddd']")))

    if len(cards) > 0:
        cards[0].click()
        product_h1 = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert product_h1.text.strip(), "Переход на товар не сработал!"
        print(f"✅ Переход на товар: {product_h1.text}")
    else:
        pytest.skip("Карточки не найдены в поиске")
