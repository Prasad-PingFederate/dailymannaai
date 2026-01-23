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
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Billy_Graham_with_Bible.jpg",
        description: "Prominent 20th-century evangelist and advisor to presidents."
    },
    "reinhard bonnke": {
        name: "Reinhard Bonnke",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Ev_Bonnke_in_Nigeria.jpg",
        description: "German-born evangelist known for massive crusades across Africa."
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
