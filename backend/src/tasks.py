import asyncio
from celery import Celery
import logging
from .processors.processor import process_and_save

# Mock actual crawlers if not provided
class YouTubeCrawler: 
    def search_videos(self, queries, max_results=20): return []
class TwitterCrawler:
    def search_tweets(self, queries, max_results=50): return []

logger = logging.getLogger(__name__)
# CELERY_BROKER = "redis://redis:6379/0"
# app = Celery('tasks', broker=CELERY_BROKER)

@app.task(bind=True, max_retries=3)
def crawl_query_task(self, query: str):
    """
    Celery task that performs a targeted crawl across all sources for the given query.
    Returns a list of content IDs that were saved.
    """
    logger.info(f"Starting on-demand crawl for query: {query}")
    content_ids = []

    # 1. Crawl YouTube
    try:
        yt_crawler = YouTubeCrawler()
        videos = yt_crawler.search_videos(queries=[query], max_results=20)
        for video in videos:
            content = process_and_save(video, 'youtube')
            if content:
                content_ids.append(content.id)
                # Note: WebSocket notification logic requires running api loop
    except Exception as e:
        logger.error(f"YouTube crawl failed: {e}")

    # 2. Crawl Twitter
    try:
        tw_crawler = TwitterCrawler()
        tweets = tw_crawler.search_tweets(queries=[query], max_results=50)
        for tweet in tweets:
            content = process_and_save(tweet, 'twitter')
            if content:
                content_ids.append(content.id)
    except Exception as e:
        logger.error(f"Twitter crawl failed: {e}")

    # 3. Crawl News Sites
    try:
        from .crawlers.scrapy_spiders.spiders.generic_news import run_generic_news_spider
        articles = run_generic_news_spider(query, max_results=20)
        for article in articles:
            content = process_and_save(article, 'news')
            if content:
                content_ids.append(content.id)
    except Exception as e:
        logger.error(f"News crawl failed: {e}")

    logger.info(f"Completed on-demand crawl for {query}, found {len(content_ids)} items")
    return content_ids
