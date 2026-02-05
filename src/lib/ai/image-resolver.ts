/**
 * Image Resolver Utility
 * Maps spiritual personalities and situational keywords to public domain portraits
 * or high-quality stock imagery with proper attribution.
 */

export interface PersonalityPortrait {
    name: string;
    imageUrl: string;
    description: string;
    attribution?: string;
    sourceUrl?: string;
}

const PERSONALITIES: Record<string, PersonalityPortrait> = {
    "sadhu sundar singh": {
        name: "Sadhu Sundar Singh",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/27/Sadhu_Sundar_Singh.jpg",
        description: "Known as the 'Apostle with the Bleeding Feet', he was an Indian Christian missionary who traveled widely in saffron robes.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Sadhu_Sundar_Singh.jpg"
    },
    "john wesley": {
        name: "John Wesley",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/John_Wesley_by_John_Michael_Williams.jpg",
        description: "18th-century Methodist leader and theologian.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:John_Wesley_by_John_Michael_Williams.jpg"
    },
    "billy graham": {
        name: "Billy Graham",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg/800px-Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg",
        description: "Prominent 20th-century evangelist and advisor to presidents.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Billy_Graham_bw_photo,_April_11,_1966.jpg"
    },
    "reinhard bonnke": {
        name: "Reinhard Bonnke",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Ev_Bonnke_in_Nigeria.jpg",
        description: "German-born evangelist known for massive crusades across Africa.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Ev_Bonnke_in_Nigeria.jpg"
    },
    "charles spurgeon": {
        name: "Charles H. Spurgeon",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Charles_Spurgeon.jpg",
        description: "The 'Prince of Preachers', a 19th-century British Baptist minister.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Charles_Spurgeon.jpg"
    },
    "martin luther": {
        name: "Martin Luther",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/91/Martin_Luther%2C_1529.jpg",
        description: "Key figure of the Protestant Reformation.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Martin_Luther,_1529.jpg"
    },
    "john calvin": {
        name: "John Calvin",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/John_Calvin.jpg",
        description: "French theologian and major Protestant reformer.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:John_Calvin.jpg"
    },
    "augustine": {
        name: "Augustine of Hippo",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/Saint_Augustine_Portrait.jpg",
        description: "4th-century theologian and philosopher from Roman North Africa.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Saint_Augustine_Portrait.jpg"
    },
    "francis of assisi": {
        name: "Francis of Assisi",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Saint_Francis_of_Assisi_%28by_Cimabue%2C_c._1280%29.jpg",
        description: "12th-century mystic and founder of the Franciscan order.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Saint_Francis_of_Assisi_(by_Cimabue,_c._1280).jpg"
    },
    "thomas aquinas": {
        name: "Thomas Aquinas",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/St-thomas-aquinas.jpg",
        description: "13th-century scholastic philosopher and 'Angelic Doctor'.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:St-thomas-aquinas.jpg"
    },
    "irenaeus": {
        name: "Irenaeus of Lyon",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Saint_Irenaeus.jpg",
        description: "2nd-century bishop and early Church Father.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Saint_Irenaeus.jpg"
    },
    "constantine": {
        name: "Constantine the Great",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Colossal_head_of_Constantine_the_Great%2C_Capitoline_Museums.jpg",
        description: "The first Roman Emperor to convert to Christianity.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Colossal_head_of_Constantine_the_Great,_Capitoline_Museums.jpg"
    },
    "athanasius": {
        name: "Athanasius of Alexandria",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/95/Saint_Athanasius.jpg",
        description: "4th-century champion of Nicene orthodoxy.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Saint_Athanasius.jpg"
    },
    "jonathan edwards": {
        name: "Jonathan Edwards",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Jonathan_Edwards.jpg",
        description: "18th-century revivalist and leader of the First Great Awakening.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Jonathan_Edwards.jpg"
    },
    "d.l. moody": {
        name: "Dwight L. Moody",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Dwight_L_Moody_LOC.jpg/800px-Dwight_L_Moody_LOC.jpg",
        description: "19th-century American evangelist and founder of Moody Bible Institute.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Dwight_L_Moody_LOC.jpg"
    },
    "joshua daniel": {
        name: "Joshua Daniel",
        imageUrl: "https://lefi.org/Portals/0/LiveSermons/JDH-Desktop-v5.jpg",
        description: "Leader of the Laymen's Evangelical Fellowship of India (LEFI).",
        attribution: "LEFI.org (Official Portrait)",
        sourceUrl: "https://lefi.org"
    },
    "hudson taylor": {
        name: "Hudson Taylor",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hudson_Taylor_%281832-1905%29_1893.jpg/800px-Hudson_Taylor_%281832-1905%29_1893.jpg",
        description: "British missionary who spent 51 years in China, founded China Inland Mission.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Hudson_Taylor_(1832-1905)_1893.jpg"
    },
    "david livingstone": {
        name: "David Livingstone",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/David_Livingstone.jpg/800px-David_Livingstone.jpg",
        description: "Scottish medical missionary and explorer in Africa.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:David_Livingstone.jpg"
    },
    "amy carmichael": {
        name: "Amy Carmichael",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Amy_Carmichael_with_children2.jpg/800px-Amy_Carmichael_with_children2.jpg",
        description: "Irish missionary who served in India for 56 years.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Amy_Carmichael_with_children2.jpg"
    },
    "mother teresa": {
        name: "Mother Teresa",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Mother_Teresa_1.jpg/800px-Mother_Teresa_1.jpg",
        description: "Albanian-Indian Catholic nun who founded the Missionaries of Charity.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Mother_Teresa_1.jpg"
    },
    "c.s. lewis": {
        name: "C.S. Lewis",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/CSLewis.jpg/800px-CSLewis.jpg",
        description: "British writer and Christian apologist, author of 'Mere Christianity'.",
        attribution: "Wikipedia (Fair Use)",
        sourceUrl: "https://en.wikipedia.org/wiki/File:CSLewis.jpg"
    },
    "dietrich bonhoeffer": {
        name: "Dietrich Bonhoeffer",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Dietrich_Bonhoeffer_%28um_1938%29.jpg/800px-Dietrich_Bonhoeffer_%28um_1938%29.jpg",
        description: "German Lutheran pastor and theologian, executed by the Nazis.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Dietrich_Bonhoeffer_(um_1938).jpg"
    },
    "corrie ten boom": {
        name: "Corrie ten Boom",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Corrie_ten_Boom_1921.jpg/800px-Corrie_ten_Boom_1921.jpg",
        description: "Dutch Christian who helped Jews escape the Holocaust.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Corrie_ten_Boom_1921.jpg"
    },
    "jesus": {
        name: "The Name of Jesus",
        imageUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=800",
        description: "Central figure of Christianity.",
        attribution: "Unsplash",
        sourceUrl: "https://unsplash.com/photos/cross-on-top-of-mountain-SST_X8p7F3k"
    },
    "richard baxter": {
        name: "Richard Baxter",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Richard_Baxter.jpg",
        description: "English Puritan church leader and theologian (1615–1691), author of 'The Saints' Everlasting Rest'.",
        attribution: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Richard_Baxter.jpg"
    }
};

const KEYWORD_IMAGES: Record<string, string> = {
    "anxiety": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800",
    "peace": "https://images.unsplash.com/photo-1499209974431-9dac3adaf477?auto=format&fit=crop&q=80&w=800",
    "faith": "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=800",
    "prayer": "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=800",
    "bible": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800"
};

/**
 * Generic fallback image (Spiritual/Neutral)
 */
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=800";

export function resolvePortrait(text: string): PersonalityPortrait | null {
    const lower = text.toLowerCase();

    // Sort keys by length descending to match specific names (e.g. "Charles Spurgeon") 
    // before generic ones (e.g. "Jesus") if both appear or are sub-strings.
    const sortedKeys = Object.keys(PERSONALITIES).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (lower.includes(key)) {
            return PERSONALITIES[key];
        }
    }
    return null;
}

export function resolveSituationalImage(text: string): string | null {
    const lower = text.toLowerCase();
    for (const key in KEYWORD_IMAGES) {
        if (lower.includes(key)) {
            return KEYWORD_IMAGES[key];
        }
    }
    return null;
}
