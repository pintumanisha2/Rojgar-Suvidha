#!/usr/bin/env python3
"""
sr_rss_fetcher.py — GitHub Actions SarkariResult RSS Fetcher
============================================================
Runs on GitHub Actions servers (which can reach SarkariResult),
fetches new SarkariResult posts, checks Supabase dedup,
and calls Vercel process-url API for each new post.

Why this exists: Vercel US servers are geo-blocked by SarkariResult's
Cloudflare. GitHub Actions (global CDN) can reach it fine.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("NEXT_PUBLIC_BASE_URL", "https://www.rojgarsuvidha.com")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://kkfgdzaoukekhlijlfsw.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmdkemFvdWtla2hsaWpsZnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjk5MTAsImV4cCI6MjA5ODQwNTkxMH0.PqmgCt02ZGDs7X6pv3IZDMG8Bp9PJ-ycE1eViYIU5a8"
)
CRON_SECRET = os.environ.get("CRON_SECRET", "rojgarsuvidha_auto_blog_2026")

SR_FEEDS = [
    "https://www.sarkariresult.com/feed/",
    "https://www.sarkariresult.com/feed/?paged=2",
]

MAX_AGE_HOURS = 48
MAX_PROCESS_PER_RUN = 3  # Process max 3 new SR posts per GitHub Actions run

def log(msg):
    print(f"[SR-Fetcher] {msg}", flush=True)

def fetch_url(url, timeout=20):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        log(f"Fetch error for {url}: {e}")
        return ""

def parse_rss_items(xml_text):
    """Parse RSS XML and return list of {title, link, pubDate}"""
    items = []
    try:
        root = ET.fromstring(xml_text)
        ns = {"content": "http://purl.org/rss/1.0/modules/content/"}
        for item in root.iter("item"):
            title_el = item.find("title")
            link_el = item.find("link")
            pub_el = item.find("pubDate")
            
            title = (title_el.text or "").strip()
            link = (link_el.text or "").strip()
            pub = (pub_el.text or "").strip()
            
            if title and link and "sarkariresult.com" in link:
                items.append({"title": title, "link": link, "pubDate": pub})
    except Exception as e:
        log(f"RSS parse error: {e}")
    return items

def is_too_old(pub_date_str):
    """Returns True if the article is older than MAX_AGE_HOURS"""
    if not pub_date_str:
        return False
    try:
        # RFC 2822 format: "Sun, 13 Sep 2026 15:55:40 +0000"
        from email.utils import parsedate_to_datetime
        pub_dt = parsedate_to_datetime(pub_date_str)
        age = datetime.now(timezone.utc) - pub_dt
        return age > timedelta(hours=MAX_AGE_HOURS)
    except:
        return False

def get_scraped_urls():
    """Fetch recent scraped URLs from Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("WARNING: Supabase credentials missing — dedup disabled")
        return set()
    
    url = f"{SUPABASE_URL}/rest/v1/scraped_urls_log?url=like.*sarkariresult*&select=url&order=scraped_at.desc&limit=500"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            urls = {row["url"] for row in data}
            log(f"Loaded {len(urls)} already-scraped SR URLs from Supabase")
            return urls
    except Exception as e:
        log(f"Supabase fetch error: {e}")
        return set()

def call_process_url_api(item, raw_html=""):
    """Call Vercel's /api/admin/process-sr-url to process a specific SR post"""
    url = f"{BASE_URL}/api/admin/process-sr-url"
    payload = json.dumps({
        "url": item["link"],
        "title": item["title"],
        "pubDate": item["pubDate"],
        "source": "sarkariresult",
        "rawHtml": raw_html,
    }).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CRON_SECRET}",
    }
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, timeout=65) as resp:
            result = json.loads(resp.read())
            return result
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:200]
        log(f"HTTP Error {e.code}: {body}")
        return {"success": False, "error": f"HTTP {e.code}"}
    except Exception as e:
        log(f"API call error: {e}")
        return {"success": False, "error": str(e)}

def main():
    log("=" * 60)
    log(f"Starting SarkariResult RSS Fetcher at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    log(f"MAX_AGE_HOURS={MAX_AGE_HOURS}, MAX_PROCESS_PER_RUN={MAX_PROCESS_PER_RUN}")
    log("=" * 60)

    # 1. Fetch RSS from all SR feeds
    all_items = []
    for feed_url in SR_FEEDS:
        log(f"Fetching: {feed_url}")
        xml = fetch_url(feed_url)
        if xml:
            items = parse_rss_items(xml)
            log(f"  → Got {len(items)} items")
            all_items.extend(items)
        else:
            log(f"  → Empty/failed")

    if not all_items:
        log("ERROR: No items fetched from any SR feed!")
        sys.exit(0)  # Don't fail the workflow

    # Deduplicate by URL
    seen = set()
    unique_items = []
    for item in all_items:
        if item["link"] not in seen:
            seen.add(item["link"])
            unique_items.append(item)

    log(f"Total unique SR items from RSS: {len(unique_items)}")

    # 2. Filter out too-old items
    fresh_items = [i for i in unique_items if not is_too_old(i["pubDate"])]
    log(f"Fresh items (within {MAX_AGE_HOURS}h): {len(fresh_items)}")

    # 3. Filter out already-scraped URLs
    scraped_urls = get_scraped_urls()
    new_items = [i for i in fresh_items if i["link"] not in scraped_urls]
    log(f"New items not yet processed: {len(new_items)}")

    if not new_items:
        log("✅ All caught up — no new SR posts to process!")
        return

    # 4. Process each new item (max MAX_PROCESS_PER_RUN)
    to_process = new_items[:MAX_PROCESS_PER_RUN]
    log(f"Processing {len(to_process)} items (limit={MAX_PROCESS_PER_RUN}):")
    for item in to_process:
        log(f"  → {item['title'][:70]}")

    success_count = 0
    for i, item in enumerate(to_process):
        log(f"\n[{i+1}/{len(to_process)}] Processing: {item['title'][:60]}")
        log(f"  URL: {item['link']}")
        
        raw_html = fetch_url(item["link"])
        if not raw_html:
            log(f"  ⚠️ Could not fetch HTML for {item['link']}, skipping")
            continue

        result = call_process_url_api(item, raw_html)
        
        if result.get("success"):
            log(f"  ✅ Success! draftId={result.get('draftId', 'N/A')}")
            success_count += 1
        else:
            log(f"  ❌ Failed: {result.get('error', 'unknown')}")
        
        # Small delay between items
        if i < len(to_process) - 1:
            time.sleep(2)

    log(f"\n{'=' * 60}")
    log(f"DONE: {success_count}/{len(to_process)} processed successfully")
    log(f"Remaining new items: {len(new_items) - len(to_process)} (will be picked up in next run)")
    log("=" * 60)

if __name__ == "__main__":
    main()
