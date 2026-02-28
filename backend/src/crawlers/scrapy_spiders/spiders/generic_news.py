import scrapy
import feedparser
from urllib.parse import quote
import logging

logger = logging.getLogger(__name__)

class ArticleItem(scrapy.Item):
    url = scrapy.Field()
    title = scrapy.Field()
    text = scrapy.Field()
    summary = scrapy.Field()
    publish_date = scrapy.Field()
    keywords = scrapy.Field()
    source = scrapy.Field()
    html = scrapy.Field()

class GenericNewsSpider(scrapy.Spider):
    name = 'generic_news'

    def __init__(self, query=None, max_results=20, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.query = query
        self.max_results = max_results
        self.start_urls = [f"https://news.google.com/rss/search?q={quote(query)}&hl=en-US&gl=US&ceid=US:en"]

    def parse(self, response):
        feed = feedparser.parse(response.text)
        entries = feed.entries[:self.max_results]
        for entry in entries:
            yield scrapy.Request(entry.link, callback=self.parse_article,
                                 meta={'title': entry.title, 'published': entry.published})

    def parse_article(self, response):
        from newspaper import Article
        article = Article(response.url)
        article.set_html(response.text)
        article.parse()
        # article.nlp()

        yield ArticleItem(
            url=response.url,
            title=response.meta['title'],
            text=article.text,
            summary='', # article.summary (requires nlp)
            publish_date=response.meta.get('published'),
            keywords=[], # article.keywords (requires nlp)
            source='Google News',
            html=response.text
        )

def run_generic_news_spider(query, max_results=20):
    """Run the spider and return a list of extracted articles."""
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    from crochet import setup
    setup()

    articles = []

    class Pipeline:
        def process_item(self, item, spider):
            articles.append(dict(item))
            return item

    settings = get_project_settings()
    settings.set('ITEM_PIPELINES', {'__main__.Pipeline': 300})
    settings.set('LOG_ENABLED', False)

    process = CrawlerProcess(settings)
    process.crawl(GenericNewsSpider, query=query, max_results=max_results)
    process.start()
    return articles
