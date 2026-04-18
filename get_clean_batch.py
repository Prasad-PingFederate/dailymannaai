import json

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\refined_eligible.json", 'r') as f:
    eligible = json.load(f)

current_langs = ['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW']
current_langs_lower = [l.lower() for l in current_langs]

# Common aliases/sub-strings to skip
skip_keywords = ['french', 'german', 'portuguese', 'spanish', 'russian', 'arabic', 'tamil', 'hindi', 'english', 'chinese', 'japanese', 'korean', 'dutch', 'swedish', 'danish', 'finnish', 'norwegian', 'italian', 'greek', 'hebrew', 'latin']

to_import = []
seen_langs = set(current_langs_lower)

for item in eligible:
    lang_name = item['lang'].lower()
    
    # Check if already in app or has skip keywords
    if any(k in lang_name for k in skip_keywords) or lang_name in seen_langs:
        continue
    
    to_import.append(item)
    seen_langs.add(lang_name)

print(f"Candidates to import: {len(to_import)}")
final_batch = to_import[:40]
for item in final_batch:
    print(f"  {item['id']} ({item['lang']}): {item['total']} verses")

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\final_import_batch.json", 'w') as f:
    json.dump(final_batch, f, indent=2)
