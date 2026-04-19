/**
 * Advanced Configuration for Daily Manna AI Voice Chat System
 * Customize these settings for your specific needs
 */

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    trustProxy: true
  },

  // Speech Recognition Configuration
  speechRecognition: {
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    language: 'en-US',
    languages: {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'ja-JP': 'Japanese',
      'zh-CN': 'Chinese (Simplified)'
    }
  },

  // Text-to-Speech Configuration
  textToSpeech: {
    defaultRate: 1.0,      // 0.5 to 2.0
    defaultPitch: 1.0,     // 0.5 to 2.0
    defaultVolume: 1.0,    // 0 to 1.0
    rateOptions: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
    pitchOptions: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
    autoPlayResponse: true,
    voiceSelectionMethod: 'native', // 'native' or 'api'
  },

  // Audio Processing
  audioProcessing: {
    enableNoiseReduction: true,
    enableEchoReduction: true,
    audioContext: {
      sampleRate: 44100,
      channels: 1
    },
    audioLevel: {
      checkInterval: 100,  // ms
      minThreshold: 0,
      maxThreshold: 100
    }
  },

  // API Configuration
  api: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
    timeout: 30000,        // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000      // 1 second
  },

  // OpenAI Configuration (if using)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt: `You are Daily Manna AI, a compassionate spiritual assistant. 
    Your purpose is to help people explore scripture, understand Christian faith, and find spiritual guidance.
    Always be warm, supportive, and biblical in your responses.
    Reference scripture when appropriate.
    Keep responses concise but meaningful (200-500 words).
    If you don't know something, be honest and suggest exploring scripture together.`
  },

  // Google Cloud Configuration (for advanced TTS)
  googleCloud: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    ttsConfig: {
      audioEncoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      voiceName: 'en-US-Neural2-C',
      pitch: 0.0,
      speakingRate: 1.0
    }
  },

  // ElevenLabs Configuration (for natural TTS)
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: 'default',
    modelId: 'eleven_monolingual_v1',
    voiceSettings: {
      stability: 0.75,
      similarity_boost: 0.75
    }
  },

  // Session Management
  session: {
    timeout: 30 * 60 * 1000,  // 30 minutes
    maxSessions: 1000,
    storageMethod: 'memory',   // 'memory' or 'mongodb'
    cleanupInterval: 5 * 60 * 1000  // 5 minutes
  },

  // Chat History
  chatHistory: {
    maxMessages: 100,
    maxHistoryItems: 20,
    storageMethod: 'localStorage',
    persistToBackend: true
  },

  // Scripture Database
  scripture: {
    dataSource: 'local',      // 'local', 'api', or 'both'
    apiEndpoint: '',
    maxSearchResults: 3,
    minRelevanceScore: 0.7
  },

  // Security & Rate Limiting
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000,  // 15 minutes
      maxRequests: 100
    },
    https: process.env.NODE_ENV === 'production',
    csrfProtection: true
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    outputFile: 'logs/app.log',
    maxSize: '10m',
    maxFiles: 5
  },

  // UI Configuration
  ui: {
    theme: 'light',           // 'light' or 'dark'
    animation: true,
    soundEffects: true,
    displayWaveform: true,
    displayTranscript: true,
    displayAudioLevel: true,
    maxMessagesDisplay: 50,
    messageScrollBehavior: 'smooth'
  },

  // Keyboard Shortcuts
  shortcuts: {
    startRecording: 'Space',
    stopRecording: 'Escape',
    clearChat: 'Ctrl+L',
    toggleSettings: 'Ctrl+,',
    toggleHistory: 'Ctrl+H'
  },

  // Feature Flags
  features: {
    voiceInput: true,
    voiceOutput: true,
    scriptureSearch: true,
    chatHistory: true,
    downloadConversation: true,
    multiLanguage: true,
    audioLevelMeter: true,
    waveformAnimation: true,
    messageActions: true,
    settings: true,
    advancedSettings: false
  },

  // Fallback Bible Verses (Local Database)
  bibleDatabase: {
    prayer: [
      'Matthew 6:6 - "But when you pray, go into your room, close the door and pray to your Father, who is unseen."',
      'Philippians 4:6 - "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."',
      'James 5:16 - "Therefore confess your sins to each other and pray for each other so that you may be healed."'
    ],
    faith: [
      'Hebrews 11:1 - "Now faith is confidence in what we hope for and assurance about what we do not see."',
      'Romans 10:17 - "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ."',
      'Mark 11:24 - "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours."'
    ],
    love: [
      '1 John 4:8 - "Whoever does not love does not know God, because God is love."',
      '1 Corinthians 13:4-7 - "Love is patient, love is kind. It does not envy, it does not boast..."',
      'John 3:16 - "For God so loved the world that he gave his one and only Son..."'
    ]
  },

  // Analytics (optional)
  analytics: {
    enabled: false,
    provider: 'google',  // 'google', 'mixpanel', or 'custom'
    trackingId: '',
    events: {
      trackVoiceInput: true,
      trackVoiceOutput: true,
      trackErrors: true,
      trackUserAction: true
    }
  },

  // Performance Optimization
  performance: {
    enableCache: true,
    cacheTTL: 3600,         // 1 hour
    enableCompression: true,
    minifyAssets: true,
    lazyLoadImages: true
  },

  // Development Settings
  development: {
    mockResponses: false,
    debugLogging: true,
    showPerformanceMetrics: true,
    allowAllOrigins: true
  }
};
