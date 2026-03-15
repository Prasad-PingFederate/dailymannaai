import json

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\eligible_bibles.json", 'r') as f:
    eligible = json.load(f)

current_langs = ['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW']

current_langs_lower = [l.lower() for l in current_langs]

missing = []
for item in eligible:
    lang_name = item['lang'].lower()
    # Check if lang name or id is in current_langs
    if lang_name not in current_langs_lower:
        missing.append(item)

print(f"Found {len(missing)} bibles NOT in the app's current list.")

# Sort by language name and print some
missing.sort(key=lambda x: x['lang'])
for item in missing[:50]:
    print(f"  {item['id']} ({item['lang']}): {item['title']}")

with open(r"c:\Users\Infobell\.gemini\antigravity\scratch\dailymannaai\new_bibles_to_import.json", 'w') as f:
    json.dump(missing, f, indent=2)
