import json
import os

with open('refined_eligible.json', 'r') as f:
    eligible = json.load(f)

# These are the short translation strings sent by BibleExplorer.tsx to the API
# when the user selects from the main dropdown
codes = {
    'tl': 'Tagalog', 
    'th': 'Thai', 
    'ja': 'Japanese', 
    'vi': 'Vietnamese', 
    'my': 'Burmese', 
    'it': 'Italian', 
    'pl': 'Polish', 
    'tr': 'Turkish', 
    'ro': 'Romanian', 
    'sw': 'Swahili', 
    'nl': 'Dutch', 
    'uk': 'Ukrainian', 
    'sv': 'Swedish', 
    'fi': 'Finnish', 
    'da': 'Danish', 
    'cs': 'Czech', 
    'hr': 'Croatian', 
    'sr': 'Serbian', 
    'mi': 'Maori', 
    'la': 'Latin', 
    'sq': 'Albanian', 
    'nb': 'Bokmal', 
    'nn': 'Nynorsk', 
    'et': 'Estonian', 
    'lv': 'Latvian', 
    'lt': 'Lithuanian', 
    'eu': 'Basque', 
    'eo': 'Esperanto',
    'ru': 'Russian',
    'ko': 'Korean',
    'de': 'German',
    'fr': 'French',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'es': 'Spanish',
    'ar': 'Arabic',
    'te': 'Telugu',
    'ta': 'Tamil',
}

matches = {}
for short, lang_name in codes.items():
    found = [l['id'].upper() for l in eligible if lang_name.lower() in l['lang'].lower()]
    # hardcoded exceptions
    if short == 'tr': found = ['TURYTC']
    if short == 'tl': found = ['TGLULB']
    if short == 'th': found = ['THAKJV']
    if short == 'my': found = ['MYA']
    if short == 'zh': found = ['ZH'] # Union version typically
    if short == 'pt': found = ['PORONBV']
    if short == 'fr': found = ['FRANCL']
    if short == 'es': found = ['SPARV1909']
    if short == 'ru': found = ['RUSSEN'] # Or RUSSYN
    if short == 'ar': found = ['ARBNAV']
    if short == 'de': found = ['DEUTKW']
    
    if found:
        matches[short] = found[0]

# Add the ones we already had manually in the resolver
manual_existing = {
    'el': 'GRCMT',
    'he': 'HEBSG',
    'te': 'TEL2017',
    'ta': 'TAM2017',
    'hindi': 'HIN2017',
    'bengali': 'BENIRV',
    'kannada': 'KANIRV',
    'malayalam': 'MAL2015',
    'marathi': 'MAR',
    'oriya': 'ORI',
    'punjabi': 'PAN',
    'gujarati': 'GUJ2017',
    'nepali': 'NPIULB',
    'indonesian': 'IND',
    'english': 'ENG-WEB-C',
    'afrikaans': 'AFR1953',
}
matches.update(manual_existing)

print("        const VERSION_RESOLVER: Record<string, string> = {")
for k, v in matches.items():
    print(f"            '{k}': '{v}',")
print("        };")
