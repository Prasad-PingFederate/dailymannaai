# Daily Manna AI - Advanced Voice Chat System

A complete, production-ready voice chat system for Daily Manna AI with speech-to-text, text-to-speech, and AI integration capabilities.

## ✨ Features

### Frontend Features
- 🎤 **Real-time Voice Input** - Speech-to-text using Web Speech API
- 🔊 **Voice Output** - Text-to-speech with multiple voice options
- 💬 **Chat Interface** - Clean, modern UI with message history
- 📝 **Live Transcription** - See what you're saying in real-time
- 📊 **Audio Level Meter** - Visual feedback of audio input
- 🌊 **Waveform Animation** - Beautiful waveform during recording
- ⚙️ **Voice Settings** - Adjust speech rate, pitch, and language
- 📋 **Message History** - Recently searched terms
- ⬇️ **Download Conversations** - Export chat as text file
- 🌍 **Multi-language Support** - 8+ languages
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Gradient design with smooth animations

### Backend Features
- 🤖 **AI Integration** - OpenAI API support (optional)
- 📖 **Scripture Database** - Built-in Bible verses
- 💾 **Session Management** - Persistent conversation history
- 🔍 **Scripture Search** - Find relevant verses
- 🗣️ **TTS Support** - Text-to-speech endpoint
- ⚡ **Error Handling** - Graceful error management
- 🔐 **CORS Enabled** - Cross-origin requests support
- 📊 **Logging** - Request/response logging

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Extract the files** to your project directory

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment** (optional):
Edit `.env` file to set your preferences:
```
PORT=5000
NODE_ENV=development
```

4. **Start the backend server:**
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║   Daily Manna AI Voice Chat Server        ║
╠════════════════════════════════════════════╣
║  Server running on port 5000              ║
║  http://localhost:5000                    ║
...
```

5. **Open the frontend:**
- Open `index.html` in your web browser
- Or serve it with a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

6. **Test the application:**
- Click the microphone button
- Speak a question (e.g., "Tell me about prayer")
- The AI will respond with both text and voice

## 📁 File Structure

```
daily-manna-ai-voice-chat/
├── index.html           # Frontend - main UI
├── server.js            # Backend - Express server
├── package.json         # Node.js dependencies
├── .env                 # Environment configuration
├── README.md            # This file
└── test.js              # API testing (optional)
```

## 🔧 Configuration

### Frontend Configuration (in index.html)

Edit the `CONFIG` object at the bottom of index.html:

```javascript
const CONFIG = {
    API_ENDPOINT: 'http://localhost:5000/api/chat',  // Your backend URL
    MAX_HISTORY: 20,                                   // Max search history
    AUTO_PLAY_RESPONSE: true,                          // Auto-play voice responses
    DEBOUNCE_TIME: 300                                 // Debounce delay (ms)
};
```

### Backend Configuration (in .env)

```env
PORT=5000                          # Server port
NODE_ENV=development               # Environment mode
OPENAI_API_KEY=sk_...             # OpenAI API key (optional)
CORS_ORIGIN=*                     # CORS settings
```

## 🎤 How to Use

### Basic Usage

1. **Start Speaking:**
   - Click the "🎤 Start Speaking" button
   - The microphone will be activated (look for the waveform animation)

2. **Speak Your Question:**
   - Ask about scripture, prayer, faith, etc.
   - Your words appear in real-time as "Live Transcript"

3. **Stop Recording:**
   - Click the "⏹ Stop Recording" button
   - Or let it automatically stop after you finish speaking

4. **Get Response:**
   - The AI responds with both text and voice
   - Click "🔊 Repeat" to hear the response again

### Advanced Features

**Voice Settings:**
- Click the ⚙️ button to open settings
- Adjust speech rate (0.5x to 2x)
- Change voice pitch
- Select language
- Choose different AI voices

**Search History:**
- Click the 📋 button to see recent searches
- Click any history item to repeat the search

**Download Conversation:**
- Click ⬇️ to save your conversation as a text file
- Useful for keeping records

**Clear Chat:**
- Click 🗑️ to clear all messages
- Starts a fresh conversation

## 🔌 API Endpoints

### Chat Endpoint
```
POST /api/chat
Content-Type: application/json

Request:
{
    "message": "Tell me about prayer",
    "sessionId": "user-123"  // Optional
}

Response:
{
    "message": "Prayer is...",
    "response": "Prayer is...",
    "sessionId": "user-123"
}
```

### Scripture Search
```
POST /api/scripture
Content-Type: application/json

Request:
{
    "keyword": "faith"
}

Response:
{
    "keyword": "faith",
    "results": ["Hebrews 11:1...", ...],
    "count": 3
}
```

### Get Conversation History
```
GET /api/history/:sessionId

Response:
{
    "sessionId": "user-123",
    "messages": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
    ],
    "count": 2
}
```

### Get Available Voices
```
GET /api/voices

Response:
{
    "voices": [
        { "id": "en-US-Neural2-A", "name": "English (US)...", "lang": "en-US" },
        ...
    ]
}
```

### Health Check
```
GET /api/health

Response:
{
    "status": "OK",
    "message": "Server is running"
}
```

## 🤖 AI Integration Options

### Option 1: Using Built-in Fallback (No API Required)
- Works out of the box
- Uses rule-based responses
- Limited but functional

### Option 2: OpenAI Integration (Recommended)

1. **Get an API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Keep it secret!

2. **Configure in .env:**
```env
OPENAI_API_KEY=sk_your_key_here
```

3. **Restart the server:**
```bash
npm start
```

The system will now use OpenAI for more intelligent responses!

### Option 3: Google Cloud TTS
For higher quality text-to-speech:

1. **Setup Google Cloud:**
   - Create a project in Google Cloud Console
   - Enable Text-to-Speech API
   - Download credentials JSON file

2. **Add to .env:**
```env
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### Option 4: ElevenLabs TTS
For most natural-sounding voices:

1. **Get API Key:**
   - Visit https://elevenlabs.io
   - Sign up for free tier
   - Get your API key

2. **Add to .env:**
```env
ELEVENLABS_API_KEY=your_key_here
```

## 🌐 Deployment

### Deploy to Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login to Heroku:**
```bash
heroku login
```

3. **Create Heroku app:**
```bash
heroku create your-app-name
```

4. **Set environment variables:**
```bash
heroku config:set OPENAI_API_KEY=sk_...
```

5. **Deploy:**
```bash
git push heroku main
```

### Deploy to Vercel (Frontend)

1. **Build static files** (if using with a frontend build tool)

2. **Upload to Vercel:**
```bash
npm install -g vercel
vercel
```

### Deploy to AWS

1. **Using AWS Lambda + API Gateway** (serverless)
2. **Using EC2** (traditional server)
3. **Using Elastic Beanstalk** (managed)

See AWS documentation for specific instructions.

## 🧪 Testing

### Test API Endpoints

Create a `test.js` file:

```javascript
const axios = require('axios');

async function testAPI() {
    try {
        // Test health endpoint
        const health = await axios.get('http://localhost:5000/api/health');
        console.log('Health:', health.data);

        // Test chat endpoint
        const chat = await axios.post('http://localhost:5000/api/chat', {
            message: 'Tell me about prayer'
        });
        console.log('Chat Response:', chat.data);

        // Test scripture search
        const scripture = await axios.post('http://localhost:5000/api/scripture', {
            keyword: 'faith'
        });
        console.log('Scripture Results:', scripture.data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPI();
```

Run tests:
```bash
node test.js
```

## 🐛 Troubleshooting

### Issue: Microphone not working

**Solution:**
- Check browser microphone permissions
- Try Chrome, Firefox, or Safari
- Check HTTPS (required for production)

### Issue: No response from server

**Solution:**
- Ensure server is running: `npm start`
- Check API endpoint in index.html
- Check console for errors
- Verify port 5000 is not in use

### Issue: Voice not playing

**Solution:**
- Check browser audio is not muted
- Enable autoplay in browser settings
- Check browser console for errors
- Verify text-to-speech is supported

### Issue: "CORS error"

**Solution:**
- Update CORS in .env: `CORS_ORIGIN=*`
- Ensure frontend and backend URLs are correct
- Restart server after changes

### Issue: OpenAI API errors

**Solution:**
- Verify API key is correct and not expired
- Check account has available credits
- Review API rate limits
- Check internet connection

## 📚 Advanced Customization

### Customize AI Responses

Edit `generateFallbackResponse()` in `server.js`:

```javascript
function generateFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();

    if (message.includes('your_topic')) {
        return 'Your custom response here...';
    }

    return 'Default response...';
}
```

### Add More Bible Verses

Edit `bibleDatabase` in `server.js`:

```javascript
const bibleDatabase = {
    'new-topic': [
        'Book Chapter:Verse - "Verse text here"',
        'Book Chapter:Verse - "Verse text here"'
    ]
};
```

### Custom Styling

Edit the CSS in `index.html`:

```css
/* Change colors */
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);

/* Change fonts */
font-family: 'Your Font', sans-serif;
```

## 🔒 Security Considerations

- Never commit `.env` file with API keys
- Use environment variables for sensitive data
- Validate user input on backend
- Implement rate limiting for production
- Use HTTPS in production
- Keep dependencies updated

## 📄 License

MIT License - Free to use and modify

## 🤝 Support & Contribution

For issues or feature requests:
1. Check troubleshooting section
2. Review console errors (F12)
3. Check backend logs
4. Verify configuration

## 📞 Contact & Resources

- **Daily Manna AI**: https://www.dailymannaai.com
- **OpenAI Docs**: https://platform.openai.com/docs
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Express.js**: https://expressjs.com

## 🎉 Getting Started Checklist

- [ ] Install Node.js
- [ ] Extract files
- [ ] Run `npm install`
- [ ] Start server: `npm start`
- [ ] Open `index.html` in browser
- [ ] Click microphone button
- [ ] Speak a question
- [ ] Hear the response!

---

**Congratulations!** You now have a fully functional voice chat system. Enjoy exploring scripture with Daily Manna AI! 🙏
