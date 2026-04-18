const fs = require('fs');
const path = require('path');
const https = require('https');

const PERSONALITIES = {
    "sadhu sundar singh": "https://upload.wikimedia.org/wikipedia/commons/2/27/Sadhu_Sundar_Singh.jpg",
    "john wesley": "https://upload.wikimedia.org/wikipedia/commons/1/1c/John_Wesley_by_John_Michael_Williams.jpg",
    "billy graham": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg/640px-Billy_Graham_bw_photo%2C_April_11%2C_1966.jpg",
    "reinhard bonnke": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Ev_Bonnke_in_Nigeria.jpg",
    "charles spurgeon": "https://upload.wikimedia.org/wikipedia/commons/2/29/Charles_Spurgeon.jpg",
    "martin luther": "https://upload.wikimedia.org/wikipedia/commons/9/91/Martin_Luther%2C_1529.jpg",
    "john calvin": "https://upload.wikimedia.org/wikipedia/commons/5/58/John_Calvin.jpg",
    "augustine": "https://upload.wikimedia.org/wikipedia/commons/0/05/Saint_Augustine_Portrait.jpg",
    "francis of assisi": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Saint_Francis_of_Assisi_%28by_Cimabue%2C_c._1280%29.jpg",
    "thomas aquinas": "https://upload.wikimedia.org/wikipedia/commons/d/de/St-thomas-aquinas.jpg",
    "irenaeus": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Saint_Irenaeus.jpg",
    "constantine": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Colossal_head_of_Constantine_the_Great%2C_Capitoline_Museums.jpg",
    "athanasius": "https://upload.wikimedia.org/wikipedia/commons/9/95/Saint_Athanasius.jpg",
    "jonathan edwards": "https://upload.wikimedia.org/wikipedia/commons/a/af/Jonathan_Edwards.jpg",
    "d.l. moody": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Dwight_L_Moody_LOC.jpg/800px-Dwight_L_Moody_LOC.jpg",
    "joshua daniel": "https://lefi.org/Portals/0/LiveSermons/JDH-Desktop-v5.jpg",
    "hudson taylor": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Hudson_Taylor_%281832-1905%29_1893.jpg/800px-Hudson_Taylor_%281832-1905%29_1893.jpg",
    "david livingstone": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/David_Livingstone.jpg/800px-David_Livingstone.jpg",
    "amy carmichael": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Amy_Carmichael_with_children2.jpg/800px-Amy_Carmichael_with_children2.jpg",
    "mother teresa": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Mother_Teresa_1.jpg/800px-Mother_Teresa_1.jpg",
    "c.s. lewis": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/CSLewis.jpg/800px-CSLewis.jpg",
    "dietrich bonhoeffer": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Dietrich_Bonhoeffer_%28um_1938%29.jpg/800px-Dietrich_Bonhoeffer_%28um_1938%29.jpg",
    "corrie ten boom": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Corrie_ten_Boom_1921.jpg/800px-Corrie_ten_Boom_1921.jpg",
    "jesus": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Christ_in_the_Wilderness_-_Ivan_Kramskoy_-_Google_Art_Project.jpg",
    "richard baxter": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Richard_Baxter.jpg",
    "graham stains": "https://upload.wikimedia.org/wikipedia/en/2/2a/Graham_Stains.jpg"
};

const KEYWORD_IMAGES = {
    "anxiety": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800",
    "peace": "https://images.unsplash.com/photo-1499209974431-9dac3adaf477?auto=format&fit=crop&q=80&w=800",
    "faith": "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=800",
    "prayer": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800",
    "bible": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800"
};

const BASE_DIR = path.join(process.cwd(), 'public');
const PERS_DIR = path.join(BASE_DIR, 'personalities');
const KEY_DIR = path.join(BASE_DIR, 'situations');

if (!fs.existsSync(PERS_DIR)) fs.mkdirSync(PERS_DIR, { recursive: true });
if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };
        https.get(url, options, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log("Downloading personalities...");
    for (const [name, url] of Object.entries(PERSONALITIES)) {
        const filename = name.replace(/\s+/g, '_').toLowerCase() + '.jpg';
        const dest = path.join(PERS_DIR, filename);
        try {
            await download(url, dest);
            console.log(`✅ ${name}`);
        } catch (err) {
            console.error(`❌ ${name}: ${err.message}`);
        }
    }

    console.log("\nDownloading keyword images...");
    for (const [name, url] of Object.entries(KEYWORD_IMAGES)) {
        const filename = name + '.jpg';
        const dest = path.join(KEY_DIR, filename);
        try {
            await download(url, dest);
            console.log(`✅ ${name}`);
        } catch (err) {
            console.error(`❌ ${name}: ${err.message}`);
        }
    }
}

run();
