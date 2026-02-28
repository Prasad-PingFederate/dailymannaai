// src/lib/crawler/sources.ts
// The master list of every site, feed, and channel for DailyMannaAI
// Grace Authority: 1-10 (10 being highest verified ministry)

export interface RSSFeedSource {
    name: string;
    url: string;
    category: 'news' | 'theology' | 'devotional' | 'sermon' | 'missions' | 'family' | 'apologetics' | 'qa' | 'culture';
    priority: number;
    authorityScore: number;
}

export const RSS_FEEDS: RSSFeedSource[] = [
    // --- MAJOR CHRISTIAN NEWS ---
    { name: 'Christianity Today', url: 'https://www.christianitytoday.com/rss/ct.xml', category: 'news', priority: 1, authorityScore: 10 },
    { name: 'Christian Post', url: 'https://www.christianpost.com/rss/', category: 'news', priority: 1, authorityScore: 9 },
    { name: 'CBN News', url: 'https://www.cbn.com/cbnnews/rss/feed/?type=full', category: 'news', priority: 1, authorityScore: 9 },
    { name: 'Crosswalk', url: 'https://www.crosswalk.com/rss/', category: 'news', priority: 1, authorityScore: 8 },
    { name: 'Relevant Magazine', url: 'https://relevantmagazine.com/feed/', category: 'news', priority: 2, authorityScore: 7 },
    { name: 'Baptist Press', url: 'https://www.baptistpress.com/feed/', category: 'news', priority: 2, authorityScore: 8 },

    // --- THEOLOGY & DOCTRINE ---
    { name: 'The Gospel Coalition', url: 'https://www.thegospelcoalition.org/feed/', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Desiring God', url: 'https://www.desiringgod.org/rss', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Ligonier Ministries', url: 'https://www.ligonier.org/rss', category: 'theology', priority: 1, authorityScore: 10 },
    { name: 'Crossway', url: 'https://www.crossway.org/rss/', category: 'theology', priority: 1, authorityScore: 9 },
    { name: 'First Things', url: 'https://www.firstthings.com/rss/web-exclusives', category: 'theology', priority: 2, authorityScore: 8 },

    // --- DEVOTIONALS ---
    { name: 'Our Daily Bread', url: 'https://odb.org/feed/', category: 'devotional', priority: 1, authorityScore: 10 },
    { name: 'Billy Graham Devotional', url: 'https://billygraham.org/devotions/feed/', category: 'devotional', priority: 1, authorityScore: 10 },
    { name: 'Grace to You', url: 'https://www.gty.org/rss', category: 'devotional', priority: 1, authorityScore: 10 },

    // --- Q&A / APOLOGETICS ---
    { name: 'Got Questions', url: 'https://www.gotquestions.org/gotquestions-rss.xml', category: 'qa', priority: 1, authorityScore: 10 },
    { name: 'Stand to Reason', url: 'https://www.str.org/w/rss.xml', category: 'apologetics', priority: 2, authorityScore: 9 },
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
