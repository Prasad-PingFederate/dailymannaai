import json

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'r') as f:
    first_batch = json.load(f)
first_batch_ids = [item['id'] for item in first_batch]

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
    eligible = json.load(f)

current_langs = ['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW']
current_langs_lower = [l.lower() for l in current_langs]
skip_keywords = ['french', 'german', 'portuguese', 'spanish', 'russian', 'arabic', 'tamil', 'hindi', 'english', 'chinese', 'japanese', 'korean', 'dutch', 'swedish', 'danish', 'finnish', 'norwegian', 'italian', 'greek', 'hebrew', 'latin']

second_batch = []
seen_langs = set(current_langs_lower)
for item in first_batch:
    seen_langs.add(item['lang'].lower())

for item in eligible:
    lang_name = item['lang'].lower()
    if any(k in lang_name for k in skip_keywords) or lang_name in seen_langs:
        continue
    if item['id'] in first_batch_ids:
        continue
    second_batch.append(item)
    seen_langs.add(lang_name)
    if len(second_batch) >= 50:
        break

print(f"Second batch picked: {len(second_batch)} bibles.")
with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\second_import_batch.json", 'w') as f:
    json.dump(second_batch, f, indent=2)

for item in second_batch:
    print(f"  {item['id']} ({item['lang']})")
