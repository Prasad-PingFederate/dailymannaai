// src/lib/crawler/sources.ts
// The master list of every site, feed, and channel for DailyMannaAI
// Grace Authority: 1-10 (10 being highest verified ministry)

export interface RSSFeedSource {
    name: string;
    url: string;
    category: 'news' | 'theology' | 'devotional' | 'sermon' | 'missions' | 'family' | 'apologetics' | 'qa' | 'culture' | 'world';
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
