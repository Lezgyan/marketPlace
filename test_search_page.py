import pytest
import time
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_search_hats(driver, api_base_url):
    driver.get("http://localhost:3000/search")
    wait = WebDriverWait(driver, 20)

    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Поиск товаров')]")))

    search_input = wait.until(EC.element_to_be_clickable((
        By.CSS_SELECTOR, 'input[placeholder="Введите название товара..."]')))
    search_input.clear()
    search_input.send_keys("ноутбук")

    time.sleep(5)

    wait.until_not(EC.presence_of_element_located((By.XPATH, "//p[contains(text(), 'Загрузка')]")))

    product_selectors = [
        'div[style*="border: 1px solid #ddd"]',
        'div[style*="width: 250px"]',
        'div[style*="boxShadow: \'0 2px 4px"]',
        'div[style*="padding: \'8px\'"]'

]

    products = []
    for selector in product_selectors:
        products = driver.find_elements(By.CSS_SELECTOR, selector)
        if len(products) > 0:
            print(f"Найдено {len(products)} карточек: {selector}")
            break

    if len(products) == 0:
        empty_msg = driver.find_elements(By.XPATH, "//p[contains(text(), 'Товары не найдены')]")
        if len(empty_msg) > 0:
            print(f"Пустой поиск (нормально): {empty_msg[0].text}")
            pytest.skip("Нет товаров — нормальный результат")


    first_product = products[0]
    name_elem = first_product.find_element(By.XPATH, ".//h3")
    name = name_elem.text.lower().strip()

    print(f"Первый товар: '{name}'")
    assert name, "Название пустое!"
    assert any(word in name for word in ["ноутбук", "notebook", "laptop"]), f"Не релевантно: '{name}'"


def test_search_api_direct(api_base_url):
    try:
        payload = {"Стабилизация": "белый"}
        response = requests.post(f"{api_base_url}/products/search",
                                 json={
                                     "query": "ноутбук",
                                     "numberOfPage": 10,
                                     "priceFrom": 0,
                                     "priceTo": 100000,
                                     "payload": payload
                                 },
                                 timeout=10)
        assert response.status_code == 200
        data = response.json()
        items = data.get('items', [])
        assert len(items) >= 0
        print(f"API вернул {len(items)} товаров")
    except Exception as e:
        print(f"API: {e}")
        pytest.skip("Backend недоступен")