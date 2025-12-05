import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse, urljoin

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
    return "market.yandex" in netloc


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


def clean_title(raw: str | None) -> str | None:
    if not raw:
        return None
    title = raw.strip().replace("\u00A0", " ")
    parts = DASH_RE.split(title)
    if len(parts) > 1:
        left, right = parts[0].strip(), " ".join(parts[1:]).lower()
        if any(k in right for k in BAD_TAIL_KEYWORDS):
            title = left
    title = re.split(r"\s[•|]\s", title)[0].strip()
    title = re.sub(r"\s*\((?:[^)]*яндекс[^)]*|[^)]*market[^)]*)\)\s*$", "", title, flags=re.IGNORECASE)
    title = WS_RE.sub(" ", title).strip()
    low = title.lower()
    if any(k in low for k in BAD_ANYWHERE_KEYWORDS):
        return None
    if not (3 <= len(title) <= 150):
        return None
    return title


def clean_text_block(text: str | None) -> str | None:
    if not text:
        return None
    t = text.replace("\u00A0", " ").replace(" ", " ")
    t = re.sub(r"\s+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = WS_RE.sub(" ", t)
    t = t.strip(" \t\r\n•-")
    return t if t else None


def bullets_from_list(node: Tag) -> list[str]:
    items = []
    for li in node.find_all("li"):
        txt = li.get_text(" ", strip=True)
        txt = clean_text_block(txt)
        if txt:
            items.append(txt)
    return items


def fetch(url: str) -> str:
    resp = SESSION.get(url, timeout=20)
    resp.raise_for_status()
    return resp.text


def extract_h1(soup: BeautifulSoup) -> str | None:
    for sel in (
            'h1[data-auto="product-card-title"]',
            'h1[data-auto="title"]',
            'h1[itemprop="name"]',
            "h1",
    ):
        node = soup.select_one(sel)
        if node:
            t = clean_title(node.get_text(" ", strip=True))
            if t:
                return t
    return None


def extract_jsonld_name(soup: BeautifulSoup) -> str | None:
    for tag in soup.find_all("script", type="application/ld+json"):
        txt = tag.string or ""
        if not txt.strip():
            continue
        try:
            data = json.loads(txt)
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for obj in items:
            t = obj.get("@type")
            if t == "Product" or (isinstance(t, list) and "Product" in t):
                tname = clean_title(obj.get("name"))
                if tname:
                    return tname
    return None


def extract_meta_titles(soup: BeautifulSoup) -> list[str]:
    res = []
    og = soup.find("meta", attrs={"property": "og:title"})
    tw = soup.find("meta", attrs={"name": "twitter:title"})
    if og and og.get("content"):
        ct = clean_title(og["content"])
        if ct:
            res.append(ct)
    if tw and tw.get("content"):
        ct = clean_title(tw["content"])
        if ct:
            res.append(ct)
    if soup.title and soup.title.string:
        tt = clean_title(soup.title.string)
        if tt:
            res.append(tt)
    return res


def choose_best_title(candidates, debug: bool = False):
    if not candidates:
        return None, None
    seen = set()
    scored = []
    for title, src in candidates:
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        score = 100
        L = len(title)
        if 20 <= L <= 80:
            score += 20
        elif 8 <= L < 20 or 80 < L <= 120:
            score += 10
        low = key
        if any(k in low for k in BAD_TAIL_KEYWORDS):
            score -= 50
        if any(k in low for k in BAD_ANYWHERE_KEYWORDS):
            score -= 30
        pref = {"h1": 40, "jsonld": 30, "twitter": 20, "og": 15, "title": 5}
        score += pref.get(src, 0)
        scored.append((score, title, src))
    scored.sort(reverse=True)
    if debug:
        print("Кандидаты названия:", file=sys.stderr)
        for s, t, src in scored:
            print(f"  [{s:3}] {src}: {t}", file=sys.stderr)
    return scored[0][1], scored[0][2]


def extract_price(soup: BeautifulSoup):
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for obj in items:
            t = obj.get("@type")
            if t == "Product" or (isinstance(t, list) and "Product" in t):
                offers = obj.get("offers")
                if isinstance(offers, dict):
                    p = offers.get("price") or offers.get("lowPrice") or offers.get("highPrice")
                    c = offers.get("priceCurrency")
                    if p:
                        return to_float_price(str(p)), c
                elif isinstance(offers, list):
                    for off in offers:
                        p = off.get("price") or off.get("lowPrice") or off.get("highPrice")
                        c = off.get("priceCurrency")
                        if p:
                            return to_float_price(str(p)), c
    tag = soup.find("meta", attrs={"itemprop": "price"}) or soup.find("meta", property="product:price:amount")
    currency = None
    ctag = soup.find("meta", attrs={"itemprop": "priceCurrency"}) or soup.find("meta",
                                                                               property="product:price:currency")
    if ctag and ctag.get("content"):
        currency = ctag["content"]
    if tag and tag.get("content"):
        return to_float_price(tag["content"]), currency
    node = soup.select_one('[data-auto="mainPrice"], [data-baobab-name="price"]')
    txt = node.get_text(" ", strip=True) if node else None
    return (to_float_price(txt) if txt else None), currency


def extract_about_jsonld(soup: BeautifulSoup) -> str | None:
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for obj in items:
            t = obj.get("@type")
            if t == "Product" or (isinstance(t, list) and "Product" in t):
                desc = obj.get("description")
                if isinstance(desc, str):
                    return clean_text_block(desc)
    return None


def extract_about_meta(soup: BeautifulSoup) -> str | None:
    for attrs in ({"property": "og:description"}, {"name": "description"}):
        tag = soup.find("meta", attrs=attrs)
        if tag and tag.get("content"):
            ct = clean_text_block(tag["content"])
            if ct:
                return ct
    return None


def find_about_section_node(soup: BeautifulSoup) -> Tag | None:
    for sel in (
            '[data-auto="product-about"]',
            '[data-auto="ProductCardInformation"]',
            '[data-zone-name="about"]',
            '[data-widget="webProductDescription"]',
    ):
        node = soup.select_one(sel)
        if node:
            return node
    header = None
    for tag in soup.find_all(True):
        txt = tag.get_text(strip=True) if isinstance(tag, Tag) else ""
        if txt and ABOUT_HEADER_RE.match(txt):
            header = tag
            break
    if header:
        for parent in header.parents:
            if parent and isinstance(parent, Tag):
                if parent.name in ("section", "article", "div"):
                    return parent
    return None


def extract_about_dom(soup: BeautifulSoup) -> tuple[str | None, list[str]]:
    node = find_about_section_node(soup)
    if not node:
        return None, []
    paras = []
    bullets = []
    for ul in node.find_all(["ul", "ol"]):
        bullets.extend(bullets_from_list(ul))
    for p in node.find_all(["p", "div"]):
        if p.find(["button", "a"]):
            continue
        txt = p.get_text(" ", strip=True)
        txt = clean_text_block(txt)
        if txt and len(txt) > 30:
            paras.append(txt)
    if not paras and not bullets:
        raw = node.get_text(" ", strip=True)
        raw = clean_text_block(raw)
        if raw:
            paras = [raw]
    text = None
    if paras:
        text = paras[0]
        if len(paras) > 1 and len((text + " " + paras[1])) < 600:
            text = text + " " + paras[1]
        text = clean_text_block(text)
    return text, bullets


def extract_about(soup: BeautifulSoup) -> dict:
    text = extract_about_jsonld(soup)
    bullets: list[str] = []
    if not text:
        text = extract_about_meta(soup)
    dom_text, dom_bullets = extract_about_dom(soup)
    if dom_text and (not text or len(dom_text) > len(text)):
        text = dom_text
    if dom_bullets:
        bullets = dom_bullets
    if text:
        text = text[:5000].strip()
    return {"text": text, "bullets": bullets}


def _clean_spec_key(s: str | None) -> str | None:
    s = clean_text_block(s)
    if not s:
        return None
    return s.strip().strip(":").strip() or None


def _clean_spec_val(s: str | None) -> str | None:
    s = clean_text_block(s)
    if not s:
        return None
    s = s.strip()
    if s in {"—", "-", "–"}:
        return None
    return s or None


def _merge_spec(specs: dict, k: str, v: str):
    if k in specs:
        if v and v not in specs[k]:
            specs[k] = f"{specs[k]}, {v}"
    else:
        specs[k] = v


def find_all_specs_sections(soup: BeautifulSoup) -> list[Tag]:
    sections = []

    for sel in (
            '[data-zone-name="characteristics"]',
            '[data-zone-name="specification"]',
            '[data-zone-name="specificationContent"]',
            '[data-auto="product-specs"]',
            '[data-auto="ProductSpecs"]',
            '[data-auto="specification"]',
            '[data-widget="webCharacteristics"]',
            '[data-widget="vitrinaCharacteristics"]',
            '[data-apiary-widget-name*="Characteristics"]',
            '[data-apiary-widget-name*="characteristics"]',
            '[data-apiary-widget-name*="Specifications"]',
            '[data-apiary-widget-name*="Specs"]',
            '[data-baobab-name="characteristics"]',
    ):
        sections.extend(soup.select(sel))

    headers = soup.find_all(['h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
                            string=SPECS_HEADER_RE)
    for header in headers:
        for parent in header.parents:
            if isinstance(parent, Tag) and parent.name in ("section", "article", "div", "main"):
                if parent not in sections:
                    sections.append(parent)
                break

    general_headers = soup.find_all(['h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
                                    string=GENERAL_SPECS_RE)
    for header in general_headers:
        for parent in header.parents:
            if isinstance(parent, Tag) and parent.name in ("section", "article", "div"):
                if parent not in sections:
                    sections.append(parent)
                break

    return sections


def specs_from_dl(node: Tag, specs: dict):
    for dl in node.find_all("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        n = min(len(dts), len(dds))
        for i in range(n):
            k = _clean_spec_key(dts[i].get_text(" ", strip=True))
            v = _clean_spec_val(dds[i].get_text(" ", strip=True))
            if k and v:
                _merge_spec(specs, k, v)


def specs_from_table(node: Tag, specs: dict):
    for table in node.find_all("table"):
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) >= 2:
                k = _clean_spec_key(cells[0].get_text(" ", strip=True))
                v = _clean_spec_val(cells[1].get_text(" ", strip=True))
                if k and v:
                    _merge_spec(specs, k, v)


def specs_from_rows(node: Tag, specs: dict):
    for row in node.find_all(["div", "li", "tr"]):
        k_node = None
        v_node = None

        for sel_k in (
                '[data-auto="name"]', '[data-auto="spec-name"]', '[data-auto="char-name"]',
                '[class*="name"]', '[class*="term"]', '[class*="Term"]',
                "dt", "th"
        ):
            k_node = row.select_one(sel_k)
            if k_node:
                break
        for sel_v in (
                '[data-auto="value"]', '[data-auto="spec-value"]', '[data-auto="char-value"]',
                '[class*="value"]', '[class*="def"]', '[class*="Def"]',
                "dd", "td"
        ):
            v_node = row.select_one(sel_v)
            if v_node:
                break

        if not k_node or not v_node:
            children = [c for c in row.find_all(recursive=False) if isinstance(c, Tag)]
            if len(children) >= 2:
                k_node = k_node or children[0]
                v_node = v_node or children[1]

        if k_node and v_node:
            k = _clean_spec_key(k_node.get_text(" ", strip=True))
            if v_node.find("li"):
                parts = []
                for li in v_node.find_all("li"):
                    t = _clean_spec_val(li.get_text(" ", strip=True))
                    if t:
                        parts.append(t)
                v = ", ".join(parts) if parts else _clean_spec_val(v_node.get_text(" ", strip=True))
            else:
                v = _clean_spec_val(v_node.get_text(" ", strip=True))
            if k and v and v != "—":
                _merge_spec(specs, k, v)


def extract_specs_from_section(section: Tag) -> dict:
    specs = {}

    specs_from_dl(section, specs)
    specs_from_table(section, specs)
    specs_from_rows(section, specs)

    for div in section.find_all('div', class_=True):
        if any(cls in div.get('class', []) for cls in ['row', 'item', 'property', 'characteristic']):
            specs_from_rows(div, specs)

    return specs


def extract_specs_jsonld(soup: BeautifulSoup) -> dict:
    specs: dict[str, str] = {}
    for tag in soup.find_all("script", type="application/ld+json"):
        txt = tag.string or ""
        if not txt.strip():
            continue
        try:
            data = json.loads(txt)
        except Exception:
            continue

        items = data if isinstance(data, list) else [data]
        for obj in items:
            t = obj.get("@type")
            if t == "Product" or (isinstance(t, list) and "Product" in t):
                ap = obj.get("additionalProperty") or obj.get("additionalProperties")
                if isinstance(ap, dict):
                    ap = [ap]
                if isinstance(ap, list):
                    for p in ap:
                        name = _clean_spec_key((p or {}).get("name"))
                        val = (p or {}).get("value")
                        if isinstance(val, dict):
                            val = val.get("name") or val.get("value")
                        if isinstance(val, list):
                            val = ", ".join(str(x) for x in val)
                        val = _clean_spec_val(str(val) if val is not None else None)
                        if name and val:
                            _merge_spec(specs, name, val)

                if "model" in obj and isinstance(obj["model"], dict):
                    model = obj["model"]
                    for key, value in model.items():
                        if key not in ["@type", "name", "description"] and value:
                            name = _clean_spec_key(key)
                            val = _clean_spec_val(str(value))
                            if name and val:
                                _merge_spec(specs, name, val)

    return specs


def guess_specs_anywhere(soup: BeautifulSoup) -> dict:
    best_pairs: list[tuple[str, str]] = []

    for dl in soup.find_all("dl"):
        dts, dds = dl.find_all("dt"), dl.find_all("dd")
        n = min(len(dts), len(dds))
        pairs = []
        for i in range(n):
            k = _clean_spec_key(dts[i].get_text(" ", strip=True))
            v = _clean_spec_val(dds[i].get_text(" ", strip=True))
            if k and v:
                pairs.append((k, v))
        if len(pairs) >= 5 and len(pairs) > len(best_pairs):
            best_pairs = pairs

    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) >= 2:
                k = _clean_spec_key(cells[0].get_text(" ", strip=True))
                v = _clean_spec_val(cells[1].get_text(" ", strip=True))
                if k and v:
                    rows.append((k, v))
        if len(rows) >= 5 and len(rows) > len(best_pairs):
            best_pairs = rows

    out: dict[str, str] = {}
    for k, v in best_pairs:
        _merge_spec(out, k, v)
    return out


def extract_general_specs_special(soup: BeautifulSoup) -> dict:
    specs = {}

    general_headers = soup.find_all(string=GENERAL_SPECS_RE)
    for header in general_headers:
        if not isinstance(header.parent, Tag):
            continue

        current = header.parent
        for _ in range(10):
            current = current.find_next_sibling()
            if current is None:
                break

            if isinstance(current, Tag):
                temp_specs = {}
                specs_from_dl(current, temp_specs)
                specs_from_table(current, temp_specs)
                specs_from_rows(current, temp_specs)

                if temp_specs:
                    for k, v in temp_specs.items():
                        _merge_spec(specs, k, v)
                    break

    return specs


def _abs_url(base: str, href: str | None) -> str | None:
    if not href:
        return None
    try:
        return urljoin(base, href)
    except Exception:
        return None


def _build_spec_url(url: str) -> str:

    p = urlparse(url)
    path = p.path.rstrip("/")
    if not path.endswith("/spec"):
        path = path + "/spec"
    return urlunparse((p.scheme, p.netloc, path, "", "", ""))


def _find_spec_links(base_url: str, soup: BeautifulSoup) -> list[str]:

    candidates: list[str] = []

    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        text = a.get_text(" ", strip=True) if isinstance(a, Tag) else ""
        if "/spec" in href:
            u = _abs_url(base_url, href)
            if u: candidates.append(u)
        elif (text and SPEC_WORD_RE.search(text)) or ("spec" in (href or "")):
            u = _abs_url(base_url, href)
            if u: candidates.append(u)

    candidates.append(_build_spec_url(base_url))

    seen, out = set(), []
    for u in candidates:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _count_spec_pairs(soup: BeautifulSoup) -> int:

    all_sections = find_all_specs_sections(soup)
    total_pairs = 0
    for section in all_sections:
        section_specs = extract_specs_from_section(section)
        total_pairs += len(section_specs)
    return total_pairs


def ensure_spec_soup(url: str, soup: BeautifulSoup, min_pairs: int = 8) -> BeautifulSoup:

    total_pairs = _count_spec_pairs(soup)

    if total_pairs >= min_pairs:
        return soup

    for candidate in _find_spec_links(url, soup):
        try:
            html = fetch(candidate)
            s2 = BeautifulSoup(html, "html.parser")

            new_pairs = _count_spec_pairs(s2)

            if new_pairs >= min_pairs:
                return s2
        except Exception:
            continue

    return soup


def extract_specs_full(main_soup: BeautifulSoup, dom_soup: BeautifulSoup | None = None) -> dict:

    specs: dict[str, str] = {}


    jsonld_specs = extract_specs_jsonld(main_soup)
    for k, v in jsonld_specs.items():
        _merge_spec(specs, k, v)


    base = dom_soup or main_soup
    all_sections = find_all_specs_sections(base)

    for section in all_sections:
        section_specs = extract_specs_from_section(section)
        for k, v in section_specs.items():
            _merge_spec(specs, k, v)

    if len(specs) < 5:
        fallback_specs = guess_specs_anywhere(base)
        for k, v in fallback_specs.items():
            _merge_spec(specs, k, v)

    if not any('общ' in k.lower() for k in specs.keys()):
        general_specs = extract_general_specs_special(base)
        for k, v in general_specs.items():
            _merge_spec(specs, k, v)


    cleaned = {}
    for k, v in specs.items():
        if not k or not v:
            continue
        k = k[:200].strip()
        v = v[:500].strip()
        if k and v:
            cleaned[k] = v

    return cleaned



def parse_product(url: str, debug: bool = False) -> dict:
    if not is_market_url(url):
        raise ValueError("Ссылка должна вести на market.yandex.*")
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")

    candidates = []
    h1 = extract_h1(soup)
    if h1: candidates.append((h1, "h1"))
    jl = extract_jsonld_name(soup)
    if jl: candidates.append((jl, "jsonld"))
    metas = extract_meta_titles(soup)
    if metas:
        if len(metas) >= 1: candidates.append((metas[0], "og"))
        if len(metas) >= 2: candidates.append((metas[1], "twitter"))
        if len(metas) >= 3: candidates.append((metas[2], "title"))

    name, name_source = choose_best_title(candidates, debug=debug)
    price, currency = extract_price(soup)
    about = extract_about(soup)

    spec_soup = ensure_spec_soup(url, soup)
    specs = extract_specs_full(soup, spec_soup)

    return {
        "url": url,
        "name": name,
        "name_source": name_source,
        "price": price,
        "currency": currency or "RUB",
        "about": about,
        "specs": specs,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }


def read_urls_from_file(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", "-i")
    ap.add_argument("--output", "-o", default="result")
    ap.add_argument("--delay", type=float, default=2.0)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    urls = read_urls_from_file("list_url")

    results = []
    for idx, url in enumerate(urls, 1):
        try:
            item = parse_product(url, debug=args.debug)
            results.append(item)
            about_note = " +about" if (item.get("about", {}) or {}).get("text") or (item.get("about", {}) or {}).get(
                "bullets") else ""
            specs_note = f" +specs({len(item.get('specs') or {})})" if item.get("specs") else ""
            print(f"[{idx}/{len(urls)}] OK: {item['name']!r} — {item['price']} {item['currency']} (src={item['name_source']}){about_note}{specs_note}")
            if (idx + 1) % 100 == 0:
                with open(args.output + f"/data_{idx}.json", "w", encoding="utf-8") as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)
                results = []
        except Exception as e:
            results.append({
                "url": url,
                "name": None,
                "name_source": None,
                "price": None,
                "currency": None,
                "about": {"text": None, "bullets": []},
                "specs": {},
                "error": str(e),
                "fetched_at": datetime.now(timezone.utc).isoformat()
            })
            print(f"[{idx}/{len(urls)}] ERROR: {url} — {e}", file=sys.stderr)
        time.sleep(args.delay)


    print(f"Готово! Сохранено в {args.output}")


if __name__ == "__main__":
    main()