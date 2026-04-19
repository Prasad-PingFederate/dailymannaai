export const LANGUAGES = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export type LanguageCode = typeof LANGUAGES[number]['code'];
