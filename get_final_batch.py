import json

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
    eligible = json.load(f)

current_langs = ['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW']
current_langs_lower = [l.lower() for l in current_langs]

# Also check for codes
current_codes = ['ks', 'el', 'he', 'ja', 'vi', 'tl', 'th', 'my', 'it', 'pl', 'tr', 'ro', 'sw', 'nl', 'uk', 'sv', 'fi', 'da', 'cs', 'hr', 'sr', 'mi', 'la', 'sq', 'nb', 'nn', 'et', 'lv', 'lt', 'eu', 'eo', 'gd', 'gv', 'br', 'rmq', 'ch', 'chr', 'cop', 'cu', 'prs', 'hy', 'got', 'tlh', 'grc', 'mg', 'mn', 'nd', 'syr', 'pon', 'pot', 'sn', 'tsg', 'tpi', 'ppk', 'hbo']

to_import = []
seen_langs = set(current_langs_lower)
seen_codes = set(current_codes)

for item in eligible:
    lang_name = item['lang'].lower()
    id_code = item['id'].lower()
    short_code = item['code'].lower()
    
    if lang_name not in seen_langs and id_code not in seen_codes and short_code not in seen_codes:
        to_import.append(item)
        seen_langs.add(lang_name)
        # Avoid duplicates for same language
        # (There might be multiple versions for one language, but we'll take the best one first)

print(f"Candidates to import: {len(to_import)}")
# Pick top 40-50
final_batch = to_import[:40]
for item in final_batch:
    print(f"  {item['id']} ({item['lang']}): {item['total']} verses")

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'w') as f:
    json.dump(final_batch, f, indent=2)
