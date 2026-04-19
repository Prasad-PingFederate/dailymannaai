const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Store conversation history
const conversationHistory = new Map();
const sessionTimeout = 30 * 60 * 1000; // 30 minutes

// Bible verses database (local fallback)
const bibleDatabase = {
    'prayer': [
        'Matthew 6:6 - "But when you pray, go into your room, close the door and pray to your Father, who is unseen."',
        'Philippians 4:6 - "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."',
        'James 5:16 - "Therefore confess your sins to each other and pray for each other so that you may be healed."'
    ],
    'faith': [
        'Hebrews 11:1 - "Now faith is confidence in what we hope for and assurance about what we do not see."',
        'Romans 10:17 - "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ."',
        'Mark 11:24 - "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours."'
    ],
    'love': [
        '1 John 4:8 - "Whoever does not love does not know God, because God is love."',
        '1 Corinthians 13:4-7 - "Love is patient, love is kind. It does not envy, it does not boast..."',
        'John 3:16 - "For God so loved the world that he gave his one and only Son..."'
    ],
    'grace': [
        'Ephesians 2:8-9 - "For it is by grace you have been saved, through faith—and this is not from yourselves..."',
        'Titus 2:11 - "For the grace of God has appeared that offers salvation to all people."',
        '2 Corinthians 12:9 - "But he said to me, My grace is sufficient for you..."'
    ],
    'hope': [
        'Proverbs 23:18 - "There is surely a future hope for you, and your hope will not be cut off."',
        'Romans 15:13 - "May the God of hope fill you with all joy and peace as you trust in him..."',
        'Hebrews 10:23 - "Let us hold unswervingly to the hope we profess, for he who promised is faithful."'
    ],
    'peace': [
        'Philippians 4:7 - "And the peace of God, which transcends all understanding, will guard your hearts..."',
        'John 14:27 - "Peace I leave with you; my peace I give to you. I do not give to you as the world gives."',
        'Colossians 3:15 - "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace."'
    ],
    'strength': [
        'Philippians 4:13 - "I can do all this through him who gives me strength."',
        'Psalm 27:1 - "The Lord is my light and my salvation—whom shall I fear?"',
        '2 Timothy 1:7 - "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline."'
    ],
    'forgiveness': [
        '1 John 1:9 - "If we confess our sins, he is faithful and just and will forgive us our sins..."',
        'Matthew 6:14-15 - "For if you forgive other people when they sin against you, your heavenly Father will also forgive you."',
        'Colossians 3:13 - "Bear with each other and forgive one another if any of you has a grievance against someone."'
    ],
    'jesus': [
        'John 11:25-26 - "Jesus said to her, I am the resurrection and the life. The one who believes in me will live..."',
        'Matthew 11:28 - "Come to me, all you who are weary and burdened, and I will give you rest."',
        'John 14:6 - "Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me."'
    ],
    'god': [
        'Genesis 1:1 - "In the beginning God created the heavens and the earth."',
        'Psalm 23:1 - "The Lord is my shepherd, I lack nothing."',
        '1 John 4:16 - "And so we know and rely on the love God has for us. God is love."'
    ]
};

// API Endpoints

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

/**
 * Main Chat Endpoint
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Initialize session if needed
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, []);

            // Auto-cleanup after timeout
            setTimeout(() => {
                conversationHistory.delete(sessionId);
            }, sessionTimeout);
        }

        // Add user message to history
        const history = conversationHistory.get(sessionId);
        history.push({ role: 'user', content: message });

        // Generate response
        const response = await generateResponse(message, history);

        // Add AI response to history
        history.push({ role: 'assistant', content: response });

        res.json({
            message: response,
            response: response,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            message: 'I apologize, but I encountered an error. Please try again.'
        });
    }
});

/**
 * Text-to-Speech Endpoint (Optional - for advanced TTS)
 */
app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice = 'default', rate = 1 } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // You can integrate with Google Cloud TTS, Azure, or ElevenLabs here
        // For now, returning a placeholder response
        
        res.json({
            text: text,
            voice: voice,
            rate: rate,
            message: 'TTS endpoint - integrate with your TTS provider'
        });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

/**
 * Scripture Search Endpoint
 */
app.post('/api/scripture', async (req, res) => {
    try {
        const { keyword } = req.body;

        if (!keyword) {
            return res.status(400).json({ error: 'Keyword is required' });
        }

        const results = searchBible(keyword);

        res.json({
            keyword: keyword,
            results: results,
            count: results.length
        });

    } catch (error) {
        console.error('Scripture Search Error:', error);
        res.status(500).json({ error: 'Failed to search scriptures' });
    }
});

/**
 * Conversation History Endpoint
 */
app.get('/api/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = conversationHistory.get(sessionId) || [];

        res.json({
            sessionId: sessionId,
            messages: history,
            count: history.length
        });

    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({ error: 'Failed to retrieve history' });
    }
});

/**
 * Clear Session Endpoint
 */
app.delete('/api/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        conversationHistory.delete(sessionId);

        res.json({
            message: 'Session cleared',
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Clear Session Error:', error);
        res.status(500).json({ error: 'Failed to clear session' });
    }
});

/**
 * Get Available Voices Endpoint
 */
app.get('/api/voices', (req, res) => {
    res.json({
        voices: [
            { id: 'en-US-Neural2-A', name: 'English (US) - Neural A', lang: 'en-US' },
            { id: 'en-US-Neural2-C', name: 'English (US) - Neural C', lang: 'en-US' },
            { id: 'en-GB-Neural2-A', name: 'English (UK) - Neural A', lang: 'en-GB' },
            { id: 'en-AU-Neural2-A', name: 'English (AU) - Neural A', lang: 'en-AU' }
        ]
    });
});

// Helper Functions

/**
 * Generate AI Response
 */
async function generateResponse(userMessage, conversationHistory) {
    const lowerMessage = userMessage.toLowerCase();

    // First, try to find relevant scripture
    const scriptures = searchBible(userMessage);
    if (scriptures.length > 0) {
        return generateScriptureResponse(userMessage, scriptures);
    }

    // Try OpenAI API if configured
    if (process.env.OPENAI_API_KEY) {
        try {
            return await generateWithOpenAI(userMessage, conversationHistory);
        } catch (error) {
            console.log('OpenAI error, using fallback:', error.message);
        }
    }

    // Fallback to rule-based responses
    return generateFallbackResponse(userMessage);
}

/**
 * Generate Response with OpenAI (if API key is available)
 */
async function generateWithOpenAI(userMessage, conversationHistory) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })).concat([{
                role: 'user',
                content: userMessage
            }]),
            max_tokens: 500,
            system: 'You are Daily Manna AI, a helpful assistant that provides spiritual guidance and explains scripture. Be warm, compassionate, and biblical in your responses.'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;

    } catch (error) {
        throw new Error('OpenAI API Error: ' + error.message);
    }
}

/**
 * Search Bible Database
 */
function searchBible(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const results = [];

    for (const [key, verses] of Object.entries(bibleDatabase)) {
        if (lowerKeyword.includes(key)) {
            results.push(...verses);
        }
    }

    return results.slice(0, 3); // Return top 3 results
}

/**
 * Generate Scripture-Based Response
 */
function generateScriptureResponse(userMessage, scriptures) {
    const scriptureText = scriptures.join('\n\n');
    
    const responses = {
        'prayer': `That's a wonderful topic about prayer. Here are some relevant scriptures:\n\n${scriptureText}\n\nPrayer is the foundation of our connection with God. When you pray, remember to be honest with God about your feelings and needs.`,
        'faith': `Faith is central to our relationship with God. These scriptures speak to faith:\n\n${scriptureText}\n\nFaith grows as we trust God more deeply in our daily lives.`,
        'love': `The love of God is the greatest gift we can experience. Consider these verses:\n\n${scriptureText}\n\nGod's love is unconditional and eternal, and He calls us to love others as He loves us.`,
        'grace': `Grace is God's unmerited favor. These scriptures illuminate grace:\n\n${scriptureText}\n\nRemember that you are saved by grace through faith, not by your own works.`,
        'hope': `Hope is the confident expectation that God will fulfill His promises. These verses encourage us:\n\n${scriptureText}\n\nEven in difficult times, we can hold onto hope because God is faithful.`,
        'peace': `The peace of God surpasses all understanding. Let these scriptures guide you:\n\n${scriptureText}\n\nGod's peace comes not from circumstances, but from a relationship with Him.`,
        'strength': `In times of weakness, God's strength sustains us. These verses remind us:\n\n${scriptureText}\n\nYou are never alone in your struggles. God's strength is made perfect in our weakness.`,
        'forgiveness': `Forgiveness is a cornerstone of faith. These scriptures show us the way:\n\n${scriptureText}\n\nBoth receiving and extending forgiveness brings healing and freedom.`,
        'jesus': `Jesus is our Savior and the center of our faith. Consider these truths:\n\n${scriptureText}\n\nThrough Jesus, we have access to God's grace and eternal life.`,
        'god': `God is loving, powerful, and present in our lives. These verses reveal His nature:\n\n${scriptureText}\n\nGod invites us into a relationship with Him through faith in Jesus Christ.`
    };

    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
        if (userMessage.toLowerCase().includes(key)) {
            return response;
        }
    }

    // Default scripture response
    return `That's a meaningful question about faith. Here are some relevant scriptures:\n\n${scriptureText}\n\nThese verses offer wisdom and guidance for your spiritual journey.`;
}

/**
 * Generate Fallback Response
 */
function generateFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();

    if (message.includes('hello') || message.includes('hi')) {
        return 'Hello! Welcome to Daily Manna AI. I\'m here to help you explore scripture and spiritual wisdom. What would you like to know about today?';
    }

    if (message.includes('how are you')) {
        return 'Thank you for asking! I\'m doing well and grateful to be here to serve you. How can I help you today with your spiritual journey?';
    }

    if (message.includes('thank you') || message.includes('thanks')) {
        return 'You\'re welcome! It\'s my pleasure to help. If you have any other questions about scripture or spiritual matters, please don\'t hesitate to ask.';
    }

    if (message.includes('what can you do')) {
        return 'I can help you with:\n- Answering questions about scripture and Bible verses\n- Explaining spiritual concepts\n- Discussing prayer and faith\n- Providing guidance on Christian living\n- Exploring God\'s Word with you\n\nWhat would you like to learn about?';
    }

    if (message.includes('god') || message.includes('jesus') || message.includes('holy spirit')) {
        return 'That\'s a wonderful topic! God loves you deeply and desires a relationship with you. Jesus came to save us, and the Holy Spirit empowers our lives. Would you like to explore scripture about this topic?';
    }

    if (message.includes('struggling') || message.includes('difficult') || message.includes('hard')) {
        return 'I\'m sorry you\'re going through a difficult time. God is with you in your struggles. Remember that you\'re not alone. Through prayer and faith, we find strength and hope. Would it help to explore some encouraging scriptures?';
    }

    // Default response
    return 'That\'s a meaningful question! I\'m here to help you understand scripture and grow in your faith. Could you share a bit more about what you\'re seeking to know or understand better?';
}

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║   Daily Manna AI Voice Chat Server        ║`);
    console.log(`╠════════════════════════════════════════════╣`);
    console.log(`║  Server running on port ${PORT}              ║`);
    console.log(`║  http://localhost:${PORT}                    ║`);
    console.log(`║                                            ║`);
    console.log(`║  API Endpoints:                            ║`);
    console.log(`║  POST   /api/chat          - Chat endpoint ║`);
    console.log(`║  POST   /api/scripture     - Bible search  ║`);
    console.log(`║  POST   /api/tts           - Text-to-speech║`);
    console.log(`║  GET    /api/voices        - Get voices    ║`);
    console.log(`║  GET    /api/health        - Health check  ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});

module.exports = app;
