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
    for (const key in PERSONALITIES) {
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
