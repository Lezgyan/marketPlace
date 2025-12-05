import argparse
import time
from urllib.parse import urljoin, urlparse, parse_qsl, urlencode, urlunparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def set_query_param(url: str, key: str, value: str) -> str:
    parts = list(urlparse(url))
    qs = dict(parse_qsl(parts[4], keep_blank_values=True))
    qs[key] = value
    parts[4] = urlencode(qs, doseq=True)
    return urlunparse(parts)


def build_driver(headless: bool = True) -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=ru-RU")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    driver = webdriver.Chrome(options=options)
    return driver



def scroll_to_load(driver, timeout=15, max_rounds=12):
    last_height = driver.execute_script("return document.body.scrollHeight")
    rounds = 0
    while rounds < max_rounds:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(0.8)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            driver.execute_script("window.scrollBy(0, -200);")
            time.sleep(0.3)
            driver.execute_script("window.scrollBy(0, 200);")
            time.sleep(0.5)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
        last_height = new_height
        rounds += 1
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/product--'], a[href^='/card/']"))
        )
    except Exception:
        pass


def extract_links(driver) -> set[str]:
    anchors = driver.find_elements(
        By.CSS_SELECTOR,
        '[data-zone-name="productSnippet"] a[href^="/product--"], '
        '[data-zone-name="productSnippet"] a[href^="/card/"]'
    )
    links = set()
    base = driver.current_url
    for a in anchors:
        href = (a.get_attribute("href") or "").split("#", 1)[0]
        if href:
            links.add(urljoin(base, href))
    return links



def is_captcha_page(driver) -> bool:
    url = driver.current_url
    return "showcaptcha" in url or "captcha" in url.lower()


def parse_market(list_url: str, pages: int, out_file: str, headless: bool = True):
    driver = build_driver(headless=headless)
    all_links: set[str] = set()
    try:
        for page in range(1, pages + 1):
            if page == 1:
                page_url = list_url
            else:
                page_url = set_query_param(list_url, "page", str(page))
            driver.get(page_url)


            scroll_to_load(driver)

            page_links = extract_links(driver)
            print(f"Страница {page}: найдено {len(page_links)} ссылок")
            all_links.update(page_links)

        with open(out_file, "w", encoding="utf-8") as f:
            for link in sorted(all_links):
                f.write(link + "\n")

        print(f"Сохранено {len(all_links)} уникальных ссылок в {out_file}")

    finally:
        driver.quit()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("-o", "--out", default="links.txt")
    ap.add_argument("--pages", type=int, default=1)
    ap.add_argument("--no-headless", action="store_true")
    args = ap.parse_args()

    parse_market(args.url, args.pages, args.out, headless=not args.no_headless)


if __name__ == "__main__":
    main()
