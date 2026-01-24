/**
 * Image Resolver Utility
 * Maps spiritual personalities and situational keywords to public domain portraits
 * or high-quality stock imagery.
 */

interface PersonalityPortrait {
    name: string;
    imageUrl: string;
    description: string;
}

const PERSONALITIES: Record<string, PersonalityPortrait> = {
    "john wesley": {
        name: "John Wesley",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1c/John_Wesley_by_John_Michael_Williams.jpg",
        description: "18th-century Methodist leader and theologian."
    },
    "billy graham": {
        name: "Billy Graham",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg/800px-Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg",
        description: "Prominent 20th-century evangelist and advisor to presidents."
    },
    "reinhard bonnke": {
        name: "Reinhard Bonnke",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Ev_Bonnke_in_Nigeria.jpg",
        description: "German-born evangelist known for massive crusades across Africa."
    },
    "hudson taylor": {
        name: "Hudson Taylor",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hudson_Taylor_%281832-1905%29_1893.jpg/800px-Hudson_Taylor_%281832-1905%29_1893.jpg",
        description: "British missionary who spent 51 years in China, founded China Inland Mission."
    },
    "david livingstone": {
        name: "David Livingstone",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/David_Livingstone.jpg/800px-David_Livingstone.jpg",
        description: "Scottish medical missionary and explorer in Africa."
    },
    "amy carmichael": {
        name: "Amy Carmichael",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Amy_Carmichael_with_children2.jpg/800px-Amy_Carmichael_with_children2.jpg",
        description: "Irish missionary who served in India for 56 years."
    },
    "mary slessor": {
        name: "Mary Slessor",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Mary_Slessor.jpg/800px-Mary_Slessor.jpg",
        description: "Scottish missionary in Nigeria who fought for women's rights."
    },
    "adoniram judson": {
        name: "Adoniram Judson",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Adoniram_Judson.jpg/800px-Adoniram_Judson.jpg",
        description: "First American missionary to Burma, translated Bible to Burmese."
    },
    "george whitefield": {
        name: "George Whitefield",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/George_Whitefield_by_John_Russell.jpg/800px-George_Whitefield_by_John_Russell.jpg",
        description: "Leader of the Methodist movement and the First Great Awakening."
    },
    "jim elliot": {
        name: "Jim Elliot",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/Jim_Elliot.jpg/800px-Jim_Elliot.jpg",
        description: "American missionary martyred in Ecuador while evangelizing the Huaorani."
    },
    "george müller": {
        name: "George Müller",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/George_Muller.jpg/800px-George_Muller.jpg",
        description: "Known for his work with orphans and promoting faith missions."
    },
    "george muller": {
        name: "George Müller",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/George_Muller.jpg/800px-George_Muller.jpg",
        description: "Known for his work with orphans and promoting faith missions."
    },
    "mother teresa": {
        name: "Mother Teresa",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Mother_Teresa_1.jpg/800px-Mother_Teresa_1.jpg",
        description: "Albanian-Indian Catholic nun who founded the Missionaries of Charity."
    },
    "graham staines": {
        name: "Graham Staines",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Graham_Staines_with_family.jpg/800px-Graham_Staines_with_family.jpg",
        description: "Australian Christian missionary martyred in India in 1999."
    },
    "brother andrew": {
        name: "Brother Andrew",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Brother_Andrew_2012.jpg/800px-Brother_Andrew_2012.jpg",
        description: "Dutch missionary known for smuggling Bibles into communist countries."
    },
    "joshua daniel": {
        name: "Joshua Daniel",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Joshua_Daniel_preaching.jpg/800px-Joshua_Daniel_preaching.jpg",
        description: "Indian evangelist and founder of the Indian Evangelical Team."
    },
    "c.s. lewis": {
        name: "C.S. Lewis",
        imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/CSLewis.jpg/800px-CSLewis.jpg",
        description: "British writer and Christian apologist, author of 'Mere Christianity'."
    },
    "dietrich bonhoeffer": {
        name: "Dietrich Bonhoeffer",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Dietrich_Bonhoeffer_%28um_1938%29.jpg/800px-Dietrich_Bonhoeffer_%28um_1938%29.jpg",
        description: "German Lutheran pastor and theologian, executed by the Nazis."
    },
    "corrie ten boom": {
        name: "Corrie ten Boom",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Corrie_ten_Boom_1921.jpg/800px-Corrie_ten_Boom_1921.jpg",
        description: "Dutch Christian who helped Jews escape the Holocaust."
    },
    "jesus": {
        name: "The Name of Jesus",
        imageUrl: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=800",
        description: "Central figure of Christianity."
    }
};

const KEYWORD_IMAGES: Record<string, string> = {
    "anxiety": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800",
    "peace": "https://images.unsplash.com/photo-1499209974431-9dac3adaf477?auto=format&fit=crop&q=80&w=800",
    "faith": "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=800",
    "prayer": "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=800",
    "bible": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800"
};

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
