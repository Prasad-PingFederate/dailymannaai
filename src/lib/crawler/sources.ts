// src/lib/crawler/sources.ts
// The master list of every site, feed, and channel for DailyMannaAI
// Grace Authority: 1-10 (10 being highest verified ministry)

export interface RSSFeedSource {
    name: string;
    url: string;
    category: 'news' | 'theology' | 'devotional' | 'sermon' | 'missions' | 'family' | 'apologetics' | 'qa' | 'culture' | 'world' | 'india' | 'social';
    priority: number;
    authorityScore: number;
}

export const RSS_FEEDS: RSSFeedSource[] = [
    // ══════════════════════════════════════════════════════
    // --- 25 MAJOR WORLD NEWS SOURCES (for fresh results) ---
    // ══════════════════════════════════════════════════════
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'NY Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'world', priority: 1, authorityScore: 10 },
    { name: 'The Guardian UK', url: 'https://www.theguardian.com/uk/rss', category: 'world', priority: 2, authorityScore: 9 },
    { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/cnn_world.rss', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'Fox News World', url: 'https://moxie.foxnews.com/google-publisher/world.xml', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'Fox News Latest', url: 'https://moxie.foxnews.com/google-publisher/latest.xml', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'NPR News', url: 'https://www.npr.org/rss/rss.php?id=1001', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'NPR World', url: 'https://www.npr.org/rss/rss.php?id=1004', category: 'world', priority: 2, authorityScore: 9 },
    { name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', category: 'world', priority: 1, authorityScore: 8 },
    { name: 'Sky News Home', url: 'https://feeds.skynews.com/feeds/rss/home.xml', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'Euronews', url: 'https://www.euronews.com/rss?level=theme&name=news', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'DW News', url: 'https://www.dw.com/rss/rss.xml', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'WSJ World', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', category: 'world', priority: 1, authorityScore: 9 },
    { name: 'ABC News International', url: 'https://abcnews.go.com/abcnews/internationalheadlines', category: 'world', priority: 2, authorityScore: 8 },
    { name: 'CBS News World', url: 'https://www.cbsnews.com/latest/rss/world', category: 'world', priority: 2, authorityScore: 8 },

    // ══════════════════════════════════════════════════════
    // --- 15 MAJOR INDIAN NEWS SOURCES ---
    // ══════════════════════════════════════════════════════
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss', category: 'india', priority: 1, authorityScore: 10 },
    { name: 'The Hindu National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'india', priority: 1, authorityScore: 10 },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', category: 'india', priority: 1, authorityScore: 9 },
    { name: 'Hindustan Times World', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', category: 'india', priority: 2, authorityScore: 9 },
    { name: 'NDTV Top Stories', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', category: 'india', priority: 1, authorityScore: 9 },
    { name: 'NDTV India', url: 'https://feeds.feedburner.com/ndtvnews-india-news', category: 'india', priority: 1, authorityScore: 9 },
    { name: 'India Today', url: 'https://www.indiatoday.in/rss/home', category: 'india', priority: 1, authorityScore: 9 },
    { name: 'The Indian Express', url: 'https://indianexpress.com/feed/', category: 'india', priority: 1, authorityScore: 9 },
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', category: 'india', priority: 1, authorityScore: 8 },
    { name: 'LiveMint', url: 'https://www.livemint.com/rss/news', category: 'india', priority: 2, authorityScore: 8 },
    { name: 'The Print', url: 'https://theprint.in/feed/', category: 'india', priority: 2, authorityScore: 8 },
    { name: 'Scroll.in', url: 'https://scroll.in/feed', category: 'india', priority: 2, authorityScore: 8 },
    { name: 'The Wire', url: 'https://thewire.in/feed', category: 'india', priority: 2, authorityScore: 7 },
    { name: 'News18 India', url: 'https://www.news18.com/rss/india.xml', category: 'india', priority: 2, authorityScore: 8 },
    { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', category: 'india', priority: 2, authorityScore: 8 },

    // ══════════════════════════════════════════════════════
    // --- AUTHENTIC TWITTER/X FEEDS (via rsshub.app bridge, no API key) ---
    //     Silently ignored if rsshub instance is rate-limited or down.
    // ══════════════════════════════════════════════════════
    { name: 'BBC Breaking (Twitter)', url: 'https://rsshub.app/twitter/user/BBCBreaking', category: 'social', priority: 2, authorityScore: 10 },
    { name: 'Reuters (Twitter)', url: 'https://rsshub.app/twitter/user/Reuters', category: 'social', priority: 2, authorityScore: 10 },
    { name: 'AP News (Twitter)', url: 'https://rsshub.app/twitter/user/AP', category: 'social', priority: 2, authorityScore: 10 },
    { name: 'CNN (Twitter)', url: 'https://rsshub.app/twitter/user/CNN', category: 'social', priority: 2, authorityScore: 9 },
    { name: 'Al Jazeera (Twitter)', url: 'https://rsshub.app/twitter/user/AlJazeera', category: 'social', priority: 2, authorityScore: 9 },
    { name: 'White House (Twitter)', url: 'https://rsshub.app/twitter/user/WhiteHouse', category: 'social', priority: 2, authorityScore: 9 },
    { name: 'United Nations (Twitter)', url: 'https://rsshub.app/twitter/user/UN', category: 'social', priority: 2, authorityScore: 9 },
    { name: 'WHO (Twitter)', url: 'https://rsshub.app/twitter/user/WHO', category: 'social', priority: 2, authorityScore: 9 },
    { name: 'NDTV (Twitter)', url: 'https://rsshub.app/twitter/user/NDTVNews', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'The Hindu (Twitter)', url: 'https://rsshub.app/twitter/user/the_hindu', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'Gospel Coalition (Twitter)', url: 'https://rsshub.app/twitter/user/TGC', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'Desiring God (Twitter)', url: 'https://rsshub.app/twitter/user/DesiringGod', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'CBN News (Twitter)', url: 'https://rsshub.app/twitter/user/CBNNews', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'The Times (Twitter)', url: 'https://rsshub.app/twitter/user/thetimes', category: 'social', priority: 2, authorityScore: 8 },
    { name: 'Times of India (Twitter)', url: 'https://rsshub.app/twitter/user/timesofindia', category: 'social', priority: 2, authorityScore: 8 },

    // ══════════════════════════════════════════════════════
    // --- MAJOR CHRISTIAN NEWS ---
    // ══════════════════════════════════════════════════════
    { name: 'Christianity Today', url: 'https://www.christianitytoday.com/rss/ct.xml', category: 'news', priority: 1, authorityScore: 10 },
    { name: 'Christian Post', url: 'https://www.christianpost.com/rss/', category: 'news', priority: 1, authorityScore: 9 },
    { name: 'CBN News', url: 'https://www.cbn.com/cbnnews/rss/feed/?type=full', category: 'news', priority: 1, authorityScore: 9 },
    { name: 'Crosswalk', url: 'https://www.crosswalk.com/rss/', category: 'news', priority: 1, authorityScore: 8 },
    { name: 'Relevant Magazine', url: 'https://relevantmagazine.com/feed/', category: 'news', priority: 2, authorityScore: 7 },
    { name: 'Baptist Press', url: 'https://www.baptistpress.com/feed/', category: 'news', priority: 2, authorityScore: 8 },
    { name: 'CBN Israel', url: 'https://www.cbn.com/cbnnews/israel/rss/feed/?type=full', category: 'news', priority: 1, authorityScore: 9 },
    { name: 'Christian Post World', url: 'https://www.christianpost.com/rss/section/world/', category: 'news', priority: 2, authorityScore: 8 },
    { name: 'World Mag', url: 'https://wng.org/rss', category: 'news', priority: 1, authorityScore: 8 },
    { name: 'Mission Network News', url: 'https://www.mnnonline.org/feed/', category: 'missions', priority: 2, authorityScore: 7 },
    { name: 'Open Doors', url: 'https://www.opendoorsusa.org/feed/', category: 'missions', priority: 2, authorityScore: 8 },

    // --- THEOLOGY & DOCTRINE ---
    { name: 'The Gospel Coalition', url: 'https://www.thegospelcoalition.org/feed/', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Desiring God', url: 'https://www.desiringgod.org/rss', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Ligonier Ministries', url: 'https://www.ligonier.org/rss', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Crossway', url: 'https://www.crossway.org/rss/', category: 'theology', priority: 1, authorityScore: 9 },
    { name: 'First Things', url: 'https://www.firstthings.com/rss/web-exclusives', category: 'theology', priority: 2, authorityScore: 8 },
    { name: 'Albert Mohler', url: 'https://albertmohler.com/feed/', category: 'theology', priority: 2, authorityScore: 9 },
    { name: 'Core Christianity', url: 'https://corechristianity.com/feed/', category: 'theology', priority: 2, authorityScore: 8 },

    // --- DEVOTIONALS ---
    { name: 'Our Daily Bread', url: 'https://odb.org/feed/', category: 'devotional', priority: 1, authorityScore: 10 },
    { name: 'Billy Graham Devotional', url: 'https://billygraham.org/devotions/feed/', category: 'devotional', priority: 1, authorityScore: 10 },
    { name: 'Grace to You', url: 'https://www.gty.org/rss', category: 'devotional', priority: 1, authorityScore: 10 },

    // --- SERMONS ---
    { name: 'SermonAudio', url: 'https://www.sermonaudio.com/rss/newest.asp', category: 'sermon', priority: 2, authorityScore: 8 },
    { name: 'Truth for Life', url: 'https://www.truthforlife.org/rss/sermons/', category: 'sermon', priority: 1, authorityScore: 9 },

    // --- Q&A / APOLOGETICS ---
    { name: 'Got Questions', url: 'https://www.gotquestions.org/gotquestions-rss.xml', category: 'qa', priority: 1, authorityScore: 10 },
    { name: 'Stand to Reason', url: 'https://www.str.org/w/rss.xml', category: 'apologetics', priority: 2, authorityScore: 9 },
    { name: 'Cold Case Christianity', url: 'https://coldcasechristianity.com/feed/', category: 'apologetics', priority: 2, authorityScore: 8 },

    // --- FAMILY ---
    { name: 'Focus on the Family', url: 'https://www.focusonthefamily.com/rss/', category: 'family', priority: 1, authorityScore: 9 },
];

export const BIBLE_BOOKS = [
    'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges',
    'ruth', '1-samuel', '2-samuel', '1-kings', '2-kings', '1-chronicles', '2-chronicles',
    'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes',
    'song-of-solomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel',
    'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk',
    'zephaniah', 'haggai', 'zechariah', 'malachi',
    'matthew', 'mark', 'luke', 'john', 'acts', 'romans',
    '1-corinthians', '2-corinthians', 'galatians', 'ephesians', 'philippians',
    'colossians', '1-thessalonians', '2-thessalonians', '1-timothy', '2-timothy',
    'titus', 'philemon', 'hebrews', 'james', '1-peter', '2-peter',
    '1-john', '2-john', '3-john', 'jude', 'revelation'
];
