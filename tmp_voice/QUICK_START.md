# 🚀 Quick Start Guide - Daily Manna AI Voice Chat

## 5-Minute Setup

### Step 1: Install Node.js (if not already installed)
- Download from: https://nodejs.org/
- Choose the LTS version
- Install and verify: `node --version`

### Step 2: Extract Files
- Extract the downloaded files to a folder on your computer
- Open a terminal/command prompt in that folder

### Step 3: Install Dependencies
```bash
npm install
```
Wait for installation to complete...

### Step 4: Start the Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║   Daily Manna AI Voice Chat Server        ║
╠════════════════════════════════════════════╣
║  Server running on port 5000              ║
╚════════════════════════════════════════════╝
```

### Step 5: Open the App
- Open `index.html` in your web browser
- OR use a local server:
  ```bash
  # In another terminal/command prompt
  python -m http.server 8000
  # Then visit: http://localhost:8000/index.html
  ```

### Step 6: Test It!
1. Click the 🎤 "Start Speaking" button
2. Say something like: "Tell me about prayer"
3. Listen to the AI respond with voice!

---

## File Description

| File | Purpose |
|------|---------|
| **index.html** | Complete frontend with voice UI |
| **server.js** | Backend API server |
| **package.json** | Dependencies list |
| **.env** | Configuration settings |
| **config.js** | Advanced settings |
| **test.js** | Test the API |
| **README.md** | Full documentation |

---

## Common Commands

```bash
# Start server
npm start

# Test API
node test.js

# Run in development mode (auto-restart on changes)
npm run dev

# Install dependencies
npm install
```

---

## Troubleshooting

### Microphone not working?
- Check browser permissions
- Try Chrome, Firefox, or Safari
- Click "Allow" when browser asks for microphone

### No response from server?
- Make sure server is running: `npm start`
- Check if port 5000 is available
- Look at terminal for error messages

### Port 5000 already in use?
Edit `.env` file:
```
PORT=5001
```

### Want to use OpenAI API?
1. Get key from: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```
   OPENAI_API_KEY=sk_your_key_here
   ```
3. Restart server

---

## Project Structure

```
daily-manna-voice-chat/
├── index.html          ← Open this in browser
├── server.js           ← Backend server
├── package.json        ← Dependencies
├── .env                ← Configuration
├── config.js           ← Advanced config
├── test.js             ← Testing
├── README.md           ← Full docs
└── .gitignore          ← Git settings
```

---

## Feature Summary

✅ Real-time voice input (speech-to-text)
✅ Automatic voice response (text-to-speech)
✅ Built-in Bible verse database
✅ Beautiful chat interface
✅ Message history
✅ Download conversations
✅ Multiple language support
✅ Voice customization (pitch, rate)
✅ Modern UI with animations
✅ Mobile responsive

---

## API Endpoints

```
POST /api/chat              - Send message
POST /api/scripture         - Search Bible
GET  /api/history/:id       - Get chat history
GET  /api/voices            - Get voice options
POST /api/tts               - Text-to-speech
GET  /api/health            - Health check
```

---

## Example Questions to Try

"Tell me about prayer"
"What is faith?"
"How do I pray?"
"What is grace?"
"Tell me about love"
"What does the Bible say about forgiveness?"
"Who is Jesus?"
"What is hope?"

---

## Next Steps

1. ✅ Install and run
2. ✅ Test voice features
3. ✅ Integrate with your website
4. ✅ (Optional) Add OpenAI API for better responses
5. ✅ Deploy to production

---

## Need Help?

Check these files:
- **README.md** - Full documentation
- **server.js** - Backend code with comments
- **index.html** - Frontend code with comments
- **config.js** - All configuration options

---

## Deployment

When ready for production:
1. Set `NODE_ENV=production` in `.env`
2. Use HTTPS
3. Add OpenAI API key for better responses
4. Deploy to Heroku, AWS, or your server

See README.md for deployment instructions.

---

## Support

If you encounter issues:
1. Check the console (F12)
2. Look at server logs
3. Run: `node test.js`
4. Check README.md troubleshooting section

---

**You're all set! Enjoy your voice-enabled spiritual assistant! 🙏**

Questions? Check README.md for comprehensive documentation.
