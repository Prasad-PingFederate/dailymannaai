from ..models.models import SessionLocal, Content
# from src.es_client import index_content
# from src.processors.text_cleaner import clean_html
# from src.processors.classifier import classify_text
import logging

logger = logging.getLogger(__name__)

def process_and_save(item, source_type):
    """Clean, classify, save to DB and Elasticsearch, return Content object."""
    try:
        # Simplified for now (can add cleaner/classifier later)
        if source_type == 'youtube':
            text = item.get('description', '')
            title = item.get('title', '')
            external_id = item.get('id')
            url = item.get('url')
            published_at = item.get('published_at')
            source_name = item.get('channel', 'YouTube')
        elif source_type == 'twitter':
            text = item.get('text', '')
            title = text[:100]
            external_id = item.get('id')
            url = item.get('url')
            published_at = item.get('published_at')
            source_name = 'Twitter'
        else: # news
            text = item.get('text', '')
            title = item.get('title', '')
            external_id = item.get('url')
            url = item.get('url')
            published_at = item.get('published_at')
            source_name = item.get('source', 'News')

        cleaned_text = text # clean_html(text)
        topics = [] # classify_text(cleaned_text)

        db = SessionLocal()
        existing = db.query(Content).filter(Content.external_id == external_id).first()
        if existing:
            db.close()
            return existing

        content = Content(
            external_id=external_id,
            title=title,
            text=cleaned_text,
            source_type=source_type,
            source_name=source_name,
            url=url,
            published_at=published_at,
            topics=topics,
            raw_metadata=item
        )
        db.add(content)
        db.commit()
        db.refresh(content)
        db.close()
        
        logger.debug(f"Saved content {content.id}")
        return content
    except Exception as e:
        logger.error(f"Error processing item: {e}")
        return None
