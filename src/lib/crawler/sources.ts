// src/lib/crawler/sources.ts
// DailyMannaAI — Master Feed Registry (v2.0)
// Priority Tier System:
//   TIER 1  → Israel & Prophecy (always surfaces first)
//   TIER 2  → Second Coming / End-Times / Eschatology
//   TIER 3  → Christian News, Theology, Devotional
//   TIER 4  → Top World News (what the world is talking about)
//   TIER 5  → India News
//   TIER 6  → Social / Twitter bridges

export type FeedTier = 1 | 2 | 3 | 4 | 5 | 6;
export type FeedCategory =
    | 'israel'
    | 'prophecy'
    | 'end-times'
    | 'news'
    | 'theology'
    | 'devotional'
    | 'sermon'
    | 'missions'
    | 'family'
    | 'apologetics'
    | 'qa'
    | 'culture'
    | 'world'
    | 'india'
    | 'social';

export interface RSSFeedSource {
    name: string;
    url: string;
    category: FeedCategory;
    tier: FeedTier;           // Ranking priority (1 = highest)
    authorityScore: number;   // Domain credibility 1-10
    boostKeywords?: string[]; // Auto-boost articles containing these phrases
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — ISRAEL & HOLY LAND (Highest Priority)
// ─────────────────────────────────────────────────────────────────────────────
const ISRAEL_FEEDS: RSSFeedSource[] = [
    {
        name: 'Jerusalem Post',
        url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
        category: 'israel', tier: 1, authorityScore: 10,
        boostKeywords: ['israel', 'jerusalem', 'temple mount', 'idf', 'gaza', 'west bank'],
    },
    {
        name: 'Jerusalem Post Breaking',
        url: 'https://www.jpost.com/rss/rssfeedsbreaking.aspx',
        category: 'israel', tier: 1, authorityScore: 10,
        boostKeywords: ['israel', 'jerusalem'],
    },
    {
        name: 'Times of Israel',
        url: 'https://www.timesofisrael.com/feed/',
        category: 'israel', tier: 1, authorityScore: 10,
        boostKeywords: ['israel', 'jewish', 'hamas', 'hezbollah', 'temple'],
    },
    {
        name: 'Times of Israel — Breaking',
        url: 'https://www.timesofisrael.com/blogs/feed/',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'jerusalem'],
    },
    {
        name: 'Arutz Sheva (Israel National News)',
        url: 'https://www.israelnationalnews.com/rss.aspx',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'temple mount', 'zion'],
    },
    {
        name: 'Haaretz',
        url: 'https://www.haaretz.com/cmlink/1.628749',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'middle east', 'jerusalem'],
    },
    {
        name: 'Israel Hayom',
        url: 'https://www.israelhayom.com/feed/',
        category: 'israel', tier: 1, authorityScore: 8,
        boostKeywords: ['israel', 'netanyahu', 'idf'],
    },
    {
        name: 'CBN News — Israel',
        url: 'https://www.cbn.com/cbnnews/israel/rss/feed/?type=full',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'jerusalem', 'holy land', 'prophecy'],
    },
    {
        name: 'All Israel News',
        url: 'https://allisrael.com/feed',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'jewish', 'christian', 'middle east'],
    },
    {
        name: 'Israel Today',
        url: 'https://www.israeltoday.co.il/feed/',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'messianic', 'holy land'],
    },
    {
        name: 'Breaking Israel News',
        url: 'https://www.breakingisraelnews.com/feed/',
        category: 'israel', tier: 1, authorityScore: 8,
        boostKeywords: ['israel', 'bible prophecy', 'end times', 'temple'],
    },
    {
        name: 'Jewish Telegraphic Agency',
        url: 'https://www.jta.org/feed',
        category: 'israel', tier: 1, authorityScore: 9,
        boostKeywords: ['israel', 'jewish', 'antisemitism'],
    },
    {
        name: 'COGAT (IDF Civil Administration)',
        url: 'https://www.gov.il/RSSPage.aspx?lang=en&Odata=department&ids=2002',
        category: 'israel', tier: 1, authorityScore: 8,
    },
    {
        name: 'Al-Monitor Middle East',
        url: 'https://www.al-monitor.com/rss',
        category: 'israel', tier: 1, authorityScore: 8,
        boostKeywords: ['israel', 'iran', 'middle east', 'hezbollah'],
    },
    {
        name: 'Middle East Eye',
        url: 'https://www.middleeasteye.net/rss',
        category: 'israel', tier: 1, authorityScore: 7,
        boostKeywords: ['israel', 'palestine', 'jerusalem'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — SECOND COMING, PROPHECY & END-TIMES
// ─────────────────────────────────────────────────────────────────────────────
const PROPHECY_FEEDS: RSSFeedSource[] = [
    {
        name: 'Rapture Ready News',
        url: 'https://www.raptureready.com/featured/terry_james/tj.xml',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['rapture', 'second coming', 'tribulation', 'antichrist', 'prophecy'],
    },
    {
        name: 'Rapture Ready — Latest',
        url: 'https://www.raptureready.com/rss.xml',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['rapture', 'second coming', 'end times'],
    },
    {
        name: 'Prophecy News Watch',
        url: 'https://www.prophecynewswatch.com/rss.xml',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'end times', 'second coming', 'israel', 'revelation'],
    },
    {
        name: 'Breaking Israel News — Prophecy',
        url: 'https://www.breakingisraelnews.com/category/end-of-days/feed/',
        category: 'end-times', tier: 2, authorityScore: 8,
        boostKeywords: ['end of days', 'messiah', 'prophecy', 'revelation'],
    },
    {
        name: 'Lamb & Lion Ministries',
        url: 'https://christinprophecy.org/feed/',
        category: 'prophecy', tier: 2, authorityScore: 9,
        boostKeywords: ['second coming', 'rapture', 'prophecy', 'revelation', 'millennial'],
    },
    {
        name: 'Jack Hibbs — Prophecy',
        url: 'https://calvarycch.org/feed/',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'second coming', 'end times', 'israel'],
    },
    {
        name: 'Hal Lindsey Report',
        url: 'https://www.hallindsey.com/feed/',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'rapture', 'israel', 'revelation'],
    },
    {
        name: 'Amir Tsarfati — Behold Israel',
        url: 'https://beholdisrael.org/feed/',
        category: 'prophecy', tier: 2, authorityScore: 9,
        boostKeywords: ['israel', 'prophecy', 'second coming', 'rapture', 'middle east'],
    },
    {
        name: 'Jan Markell — Olive Tree Ministries',
        url: 'https://olivetreeviews.org/feed/',
        category: 'end-times', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'second coming', 'end times', 'israel', 'church'],
    },
    {
        name: 'Nathan Jones — Lamb & Lion Prophecy Blog',
        url: 'https://christinprophecy.org/category/blog/feed/',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'revelation', 'rapture'],
    },
    {
        name: 'Perry Stone Ministries',
        url: 'https://perrystone.org/feed/',
        category: 'prophecy', tier: 2, authorityScore: 8,
        boostKeywords: ['prophecy', 'israel', 'second coming', 'revelation'],
    },
    {
        name: 'The Christian Broadcasting Network — End Times',
        url: 'https://www.cbn.com/cbnnews/endtimes/rss/feed/?type=full',
        category: 'end-times', tier: 2, authorityScore: 9,
        boostKeywords: ['second coming', 'rapture', 'prophecy', 'end times'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — CHRISTIAN NEWS, THEOLOGY & MINISTRY
// ─────────────────────────────────────────────────────────────────────────────
const CHRISTIAN_FEEDS: RSSFeedSource[] = [
    // Major Christian News
    { name: 'Christianity Today', url: 'https://www.christianitytoday.com/rss/ct.xml', category: 'news', tier: 3, authorityScore: 10 },
    { name: 'Christianity Today — World', url: 'https://www.christianitytoday.com/rss/world.xml', category: 'news', tier: 3, authorityScore: 10 },
    { name: 'Christian Post', url: 'https://www.christianpost.com/rss/', category: 'news', tier: 3, authorityScore: 9 },
    { name: 'Christian Post — World', url: 'https://www.christianpost.com/rss/section/world/', category: 'news', tier: 3, authorityScore: 9 },
    { name: 'CBN News', url: 'https://www.cbn.com/cbnnews/rss/feed/?type=full', category: 'news', tier: 3, authorityScore: 9 },
    { name: 'Crosswalk', url: 'https://www.crosswalk.com/rss/', category: 'news', tier: 3, authorityScore: 8 },
    { name: 'Baptist Press', url: 'https://www.baptistpress.com/feed/', category: 'news', tier: 3, authorityScore: 8 },
    { name: 'World Mag', url: 'https://wng.org/rss', category: 'news', tier: 3, authorityScore: 8 },
    { name: 'Relevant Magazine', url: 'https://relevantmagazine.com/feed/', category: 'news', tier: 3, authorityScore: 7 },
    { name: 'Church Leaders', url: 'https://churchleaders.com/feed/', category: 'news', tier: 3, authorityScore: 7 },
    { name: 'Christian Headlines', url: 'https://www.christianheadlines.com/feed/', category: 'news', tier: 3, authorityScore: 7 },

    // Theology & Doctrine
    { name: 'The Gospel Coalition', url: 'https://www.thegospelcoalition.org/feed/', category: 'theology', tier: 3, authorityScore: 10 },
    { name: 'Desiring God', url: 'https://www.desiringgod.org/rss', category: 'theology', tier: 3, authorityScore: 10 },
    { name: 'Ligonier Ministries', url: 'https://www.ligonier.org/rss', category: 'theology', tier: 3, authorityScore: 10 },
    { name: 'Crossway', url: 'https://www.crossway.org/rss/', category: 'theology', tier: 3, authorityScore: 9 },
    { name: 'Albert Mohler', url: 'https://albertmohler.com/feed/', category: 'theology', tier: 3, authorityScore: 9 },
    { name: 'First Things', url: 'https://www.firstthings.com/rss/web-exclusives', category: 'theology', tier: 3, authorityScore: 8 },
    { name: 'Core Christianity', url: 'https://corechristianity.com/feed/', category: 'theology', tier: 3, authorityScore: 8 },
    { name: 'Grace to You', url: 'https://www.gty.org/rss', category: 'theology', tier: 3, authorityScore: 10 },

    // Devotionals
    { name: 'Our Daily Bread', url: 'https://odb.org/feed/', category: 'devotional', tier: 3, authorityScore: 10 },
    { name: 'Billy Graham', url: 'https://billygraham.org/devotions/feed/', category: 'devotional', tier: 3, authorityScore: 10 },

    // Sermons
    { name: 'Truth for Life (Alistair Begg)', url: 'https://www.truthforlife.org/rss/sermons/', category: 'sermon', tier: 3, authorityScore: 9 },
    { name: 'SermonAudio', url: 'https://www.sermonaudio.com/rss/newest.asp', category: 'sermon', tier: 3, authorityScore: 8 },

    // Apologetics / Q&A
    { name: 'Got Questions', url: 'https://www.gotquestions.org/gotquestions-rss.xml', category: 'qa', tier: 3, authorityScore: 10 },
    { name: 'Stand to Reason', url: 'https://www.str.org/w/rss.xml', category: 'apologetics', tier: 3, authorityScore: 9 },
    { name: 'Cold Case Christianity', url: 'https://coldcasechristianity.com/feed/', category: 'apologetics', tier: 3, authorityScore: 8 },
    { name: 'Reasons to Believe', url: 'https://reasons.org/feed', category: 'apologetics', tier: 3, authorityScore: 8 },

    // Missions
    { name: 'Mission Network News', url: 'https://www.mnnonline.org/feed/', category: 'missions', tier: 3, authorityScore: 7 },
    { name: 'Open Doors', url: 'https://www.opendoorsusa.org/feed/', category: 'missions', tier: 3, authorityScore: 8 },
    { name: 'Voice of the Martyrs', url: 'https://www.persecution.com/feed/', category: 'missions', tier: 3, authorityScore: 8 },

    // Family & Culture
    { name: 'Focus on the Family', url: 'https://www.focusonthefamily.com/rss/', category: 'family', tier: 3, authorityScore: 9 },
    { name: 'The Stream', url: 'https://stream.org/feed/', category: 'culture', tier: 3, authorityScore: 7 },
    { name: 'Aleteia', url: 'https://aleteia.org/feed/', category: 'culture', tier: 3, authorityScore: 7 },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 4 — TOP WORLD NEWS (What the world is talking about)
// ─────────────────────────────────────────────────────────────────────────────
const WORLD_NEWS_FEEDS: RSSFeedSource[] = [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'AP News', url: 'https://rsshub.app/apnews/topics/ap-top-news', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'NY Times — World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'world', tier: 4, authorityScore: 10 },
    { name: 'The Guardian UK', url: 'https://www.theguardian.com/uk/rss', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'WSJ World', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'CNN World', url: 'http://rss.cnn.com/rss/cnn_world.rss', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'Fox News World', url: 'https://moxie.foxnews.com/google-publisher/world.xml', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'Fox News Latest', url: 'https://moxie.foxnews.com/google-publisher/latest.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'NPR News', url: 'https://www.npr.org/rss/rss.php?id=1001', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'NPR World', url: 'https://www.npr.org/rss/rss.php?id=1004', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'Sky News Home', url: 'https://feeds.skynews.com/feeds/rss/home.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'Euronews', url: 'https://www.euronews.com/rss?level=theme&name=news', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'DW News', url: 'https://www.dw.com/rss/rss.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', category: 'world', tier: 4, authorityScore: 9 },
    { name: 'ABC News International', url: 'https://abcnews.go.com/abcnews/internationalheadlines', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'CBS News World', url: 'https://www.cbsnews.com/latest/rss/world', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'France 24', url: 'https://www.france24.com/en/rss', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'Deutsche Welle Asia', url: 'https://www.dw.com/rss/rss-en-asia.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'South China Morning Post', url: 'https://www.scmp.com/rss/91/feed', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', category: 'world', tier: 4, authorityScore: 8 },
    { name: 'The Economist', url: 'https://www.economist.com/latest/rss.xml', category: 'world', tier: 4, authorityScore: 9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 5 — INDIA NEWS
// ─────────────────────────────────────────────────────────────────────────────
const INDIA_FEEDS: RSSFeedSource[] = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss', category: 'india', tier: 5, authorityScore: 10 },
    { name: 'The Hindu — National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'india', tier: 5, authorityScore: 10 },
    { name: 'The Hindu — International', url: 'https://www.thehindu.com/news/international/feeder/default.rss', category: 'india', tier: 5, authorityScore: 10 },
    { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'Hindustan Times — World', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'NDTV Top Stories', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'NDTV India', url: 'https://feeds.feedburner.com/ndtvnews-india-news', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'India Today', url: 'https://www.indiatoday.in/rss/home', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'The Indian Express', url: 'https://indianexpress.com/feed/', category: 'india', tier: 5, authorityScore: 9 },
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'LiveMint', url: 'https://www.livemint.com/rss/news', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'The Print', url: 'https://theprint.in/feed/', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'Scroll.in', url: 'https://scroll.in/feed', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'The Wire', url: 'https://thewire.in/feed', category: 'india', tier: 5, authorityScore: 7 },
    { name: 'News18 India', url: 'https://www.news18.com/rss/india.xml', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'india', tier: 5, authorityScore: 8 },
    { name: 'Indian Christians (EFI)', url: 'https://www.efionline.org/feed/', category: 'india', tier: 5, authorityScore: 8,
        boostKeywords: ['india', 'christian', 'church', 'persecution', 'ministry'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 6 — SOCIAL / X (TWITTER) VIA RSSHUB BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
const SOCIAL_FEEDS: RSSFeedSource[] = [
    { name: 'BBC Breaking (X)', url: 'https://rsshub.app/twitter/user/BBCBreaking', category: 'social', tier: 6, authorityScore: 10 },
    { name: 'Reuters (X)', url: 'https://rsshub.app/twitter/user/Reuters', category: 'social', tier: 6, authorityScore: 10 },
    { name: 'AP News (X)', url: 'https://rsshub.app/twitter/user/AP', category: 'social', tier: 6, authorityScore: 10 },
    { name: 'CNN (X)', url: 'https://rsshub.app/twitter/user/CNN', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'Al Jazeera (X)', url: 'https://rsshub.app/twitter/user/AlJazeera', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'White House (X)', url: 'https://rsshub.app/twitter/user/WhiteHouse', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'United Nations (X)', url: 'https://rsshub.app/twitter/user/UN', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'WHO (X)', url: 'https://rsshub.app/twitter/user/WHO', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'NDTV (X)', url: 'https://rsshub.app/twitter/user/NDTVNews', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'The Hindu (X)', url: 'https://rsshub.app/twitter/user/the_hindu', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'Jerusalem Post (X)', url: 'https://rsshub.app/twitter/user/Jerusalem_Post', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'Times of Israel (X)', url: 'https://rsshub.app/twitter/user/TimesofIsrael', category: 'social', tier: 6, authorityScore: 9 },
    { name: 'Amir Tsarfati (X)', url: 'https://rsshub.app/twitter/user/BeholdIsrael', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'Gospel Coalition (X)', url: 'https://rsshub.app/twitter/user/TGC', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'Desiring God (X)', url: 'https://rsshub.app/twitter/user/DesiringGod', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'CBN News (X)', url: 'https://rsshub.app/twitter/user/CBNNews', category: 'social', tier: 6, authorityScore: 8 },
    { name: 'Breaking Israel News (X)', url: 'https://rsshub.app/twitter/user/BrkngIsraelNews', category: 'social', tier: 6, authorityScore: 8 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — All feeds sorted by Tier (ascending = highest priority first)
// ─────────────────────────────────────────────────────────────────────────────
export const RSS_FEEDS: RSSFeedSource[] = [
    ...ISRAEL_FEEDS,
    ...PROPHECY_FEEDS,
    ...CHRISTIAN_FEEDS,
    ...WORLD_NEWS_FEEDS,
    ...INDIA_FEEDS,
    ...SOCIAL_FEEDS,
];

// Helper: Get feeds by tier
export const getFeedsByTier = (tier: FeedTier) => RSS_FEEDS.filter(f => f.tier === tier);

// Helper: Get feeds by category
export const getFeedsByCategory = (cat: FeedCategory) => RSS_FEEDS.filter(f => f.category === cat);

// ─────────────────────────────────────────────────────────────────────────────
// BIBLE BOOKS — Canonical list for scripture detection
// ─────────────────────────────────────────────────────────────────────────────
export const BIBLE_BOOKS = [
    'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges',
    'ruth', '1 samuel', '2 samuel', '1 kings', '2 kings', '1 chronicles', '2 chronicles',
    'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes',
    'song of solomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel',
    'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk',
    'zephaniah', 'haggai', 'zechariah', 'malachi',
    'matthew', 'mark', 'luke', 'john', 'acts', 'romans',
    '1 corinthians', '2 corinthians', 'galatians', 'ephesians', 'philippians',
    'colossians', '1 thessalonians', '2 thessalonians', '1 timothy', '2 timothy',
    'titus', 'philemon', 'hebrews', 'james', '1 peter', '2 peter',
    '1 john', '2 john', '3 john', 'jude', 'revelation',
];
