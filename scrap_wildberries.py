import argparse
import json
import re
import sys
import uuid
import time
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse, urljoin
from urllib.parse import urljoin, urlparse, parse_qsl, urlencode, urlunparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import requests
from bs4 import BeautifulSoup, Tag

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": UA,
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
})

PRICE_NUM_RE = re.compile(r"[\d\s\u00A0]+[.,]?\d*")
DASH_RE = re.compile(r"\s*[–—-]\s*")
WS_RE = re.compile(r"\s+")
ABOUT_HEADER_RE = re.compile(r"^\s*О\s+товаре\s*$", re.IGNORECASE)
SPECS_HEADER_RE = re.compile(r"^\s*Характеристик[аиы]?\s*$", re.IGNORECASE)
GENERAL_SPECS_RE = re.compile(r"^\s*Общ(?:ие|ая)\s+характеристик", re.IGNORECASE)
SPEC_WORD_RE = re.compile(r"характеристик", re.IGNORECASE)

BAD_TAIL_KEYWORDS = (
    "купить", "характерист", "отзыв", "цена", "цены",
    "доставка", "яндекс", "market", "интернет-магазин", "магазин", "официальный",
)
BAD_ANYWHERE_KEYWORDS = ("акция", "скидк", "распродаж", "лучшие цены")


def is_market_url(url: str) -> bool:
    netloc = urlparse(url).netloc
    return "wildberries" in netloc

def to_float_price(raw: str | None) -> float | None:
    if not raw:
        return None
    s = raw.strip().replace("\u00A0", " ").replace(" ", " ")
    m = PRICE_NUM_RE.search(s)
    if not m:
        return None
    num = m.group(0).replace(" ", "")
    num = num.replace(",", ".")
    try:
        return float(num)
    except ValueError:
        return None




def build_driver(headless: bool = True) -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=ru-RU")
    options.add_argument("--enable-javascript")

    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ""
    )

    driver = webdriver.Chrome(options=options)
    return driver

def scroll_down(driver, pixels=1000):
    last_height = driver.execute_script("return document.body.scrollHeight")
    driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight);")


def get_all_links_on_page(driver):
    links_with_data = []

    try:

        link_elements = driver.find_elements(By.CSS_SELECTOR, "#app > div:nth-child(5) > div > div.main-page__content-wrapper > div > article")

        for i, element in enumerate(link_elements):
            hr = element.find_element(By.CSS_SELECTOR, "div > a")
            href = hr.get_attribute("href")
            if not href:
                continue

            link_data = {
                'href': href,
                'index': i,
                'text': element.text[:100] if element.text else '',
                'class': element.get_attribute('class') or '',
                'id': element.get_attribute('id') or ''
            }

            links_with_data.append(link_data)

    except Exception as e:
        print(f"Ошибка при получении ссылок: {e}")

    return links_with_data


def extract_new_links(current_links, checkpoint):
    if not current_links:
        return []

    if checkpoint is None:
        return [link['href'] for link in current_links]

    checkpoint_index = -1
    for i, link_data in enumerate(current_links):
        if link_data['href'] == checkpoint:
            checkpoint_index = i
            break

    if checkpoint_index == -1:
        return [link['href'] for link in current_links[-20:]]

    new_links_data = current_links[checkpoint_index + 1:]
    return [link['href'] for link in new_links_data]


def efficient_scroll_parse(driver, max_scrolls=100, scroll_pause=2):
    all_links = []
    checkpoint = None
    for scroll_num in range(1, max_scrolls + 1):
        time.sleep(scroll_pause)

        current_links = get_all_links_on_page(driver)

        if not current_links:
            scroll_down(driver)
            continue

        new_links = extract_new_links(current_links, checkpoint)

        if new_links:

            all_links.extend(new_links)
            checkpoint = new_links[-1]

        scroll_down(driver)

        if scroll_num > 3 and len(new_links) == 0:
            print("3 шага подряд без новых ссылок. Завершение")
            break

    print(f"\nсобрано {len(all_links)} ссылок")
    return all_links

def main():
    driver = build_driver(headless=True)
    driver.get("https://wildberries.ru")
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#app > div:nth-child(5) > div > div.main-page__content-wrapper > div > article:nth-child(8)")))
    html = driver.page_source


    soup = BeautifulSoup(html, 'html.parser')

    links = efficient_scroll_parse(driver, scroll_pause=2, max_scrolls=1)

    products = []
    for link in links:
        product = dict()

        driver.get(link)
        breadcrumbs = []
        parent = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productNav--m8y4p > div.breadcrumbs--KOQBk > div > span > ul"))
        )
        all_children = parent.find_elements(By.TAG_NAME, "li")
        for i, child in enumerate(all_children, 1):
            if child.text != "Главная":
                breadcrumbs.append(child.text)

        element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productPageContent--jaf94 > div.mainWrap--ZLbE5 > div.background--EIrtc.options--Mo1za > div > button"))
        )
        name = driver.find_element(By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productPageContent--jaf94 > div.mainWrap--ZLbE5 > div.background--EIrtc.header--dsYHe > div > div.productHeader--uACli > h3").text

        price = driver.find_element(By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productPageContent--jaf94 > div.productPageAside--k2l7R > div > div > div.productPrice--FrVYO.productPriceAside--XPYC1 > div > div > div > div > div > span.priceBlockPrice--xf8pi > ins").text
        art = driver.find_element(By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productPageContent--jaf94 > div.mainWrap--ZLbE5 > div.background--EIrtc.options--Mo1za > div > div > table > tbody > tr:nth-child(1) > td > button > span").text

        pics = driver.find_element(By.CSS_SELECTOR, "#reactContainers > div:nth-child(2) > div > div.productPageContent--jaf94 > div.mediaSlider--k1JWH > div > div > div.swiper.swiper-initialized.swiper-vertical.miniaturesSwiper--nsh6h")
        pics_urls = []
        for pic in pics.find_elements(By.TAG_NAME, "img"):
            pics_urls.append(pic.get_attribute("src"))
        element.click()
        info_page = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, '[id^=":r"][id$=":"]')))
        if len(info_page.find_elements(By.CSS_SELECTOR,"div.content--vcPhl > div > button")) > 0:
            tables = info_page.find_element(By.CSS_SELECTOR, "div.content--vcPhl > section:nth-child(2)")
        else:
            tables = info_page.find_element(By.CSS_SELECTOR, "div.content--vcPhl > section:nth-child(1)")

        specs = dict()
        uid = uuid.uuid4()
        fetched_at = datetime.now(timezone.utc).isoformat()
        product["url"] = link
        product["name"] = name
        product["price"] = to_float_price(price)
        product["currency"] = "RUR"
        product["fetched_at"] = fetched_at
        product["Артикул Маркета"] = art
        for table in tables.find_elements(By.TAG_NAME, "table"):
            tbody = table.find_element(By.CSS_SELECTOR, 'tbody')
            for tr in tbody.find_elements(By.TAG_NAME, 'tr'):
                th = tr.find_element(By.CSS_SELECTOR, 'th').text
                td = tr.find_element(By.CSS_SELECTOR, 'td').text
                product[th] = td
        desc = WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "#section-description"))).text
        print("Описание ", driver.find_element(By.CSS_SELECTOR,"#section-description").text)



        product["text"] = desc
        product["tags"] = breadcrumbs
        product["id"] = str(uid)
        product["picture_urls"] = pics_urls
        products.append(product)


    with open("data.json", "w", encoding="utf-8") as json_file:
        json.dump(products, json_file, ensure_ascii=False, indent=4)
if __name__ == "__main__":
    main()