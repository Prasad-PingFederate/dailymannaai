# NotebookLLM.ai - Christian Research Assistant

A spiritual research assistant powered by AI, grounded in Scripture and the teachings of great Christian leaders.

## Features

- 📚 **Grounded AI Responses** - Answers based on your uploaded sources
- 🎤 **Sermon Analysis** - Upload MP3 sermons for transcription and analysis
- 🖼️ **Missionary Portraits** - Visual cards for 20+ Christian leaders
- 🔄 **Multi-AI Fallback** - Automatic switching between 4 AI providers
- 📖 **Scripture Integration** - Bible-based wisdom and guidance

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prasad-PingFederate/notebookllm.ai.git
   cd notebookllm.ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Multi-API Configuration

The system supports **4 AI providers** with automatic fallback:

### Supported Providers

1. **Google Gemini** (Primary)
   - Free tier: 60 requests/minute
   - Get key: [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **Groq** (Recommended - Fastest)
   - Free tier: 14,400 requests/day
   - Get key: [console.groq.com](https://console.groq.com)

3. **Hugging Face** (Reliable)
   - Free tier: Rate limited
   - Get key: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

4. **Together AI** (Premium)
   - Free tier: $25 credits
   - Get key: [api.together.xyz](https://api.together.xyz)

### Setup

Add API keys to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_hf_token
TOGETHER_API_KEY=your_together_key
```

**You only need ONE API key to get started!** Adding more provides better reliability and higher rate limits.

## How It Works

### Automatic Fallback

```
User Query → Try Gemini → (Rate Limit) → Try Groq → (Rate Limit) → Try Hugging Face → (Rate Limit) → Try Together AI
```

The system automatically switches to the next provider when rate limits are hit, ensuring **zero downtime** for users.

### Rate Limits

With all 4 providers configured:
- **Combined**: ~200+ requests/minute
- **Daily**: ~20,000+ questions/day
- **Cost**: $0 (all free tiers)

## Missionary Database

Includes 20+ Christian leaders with portraits:
- Hudson Taylor, Amy Carmichael, Mother Teresa
- Billy Graham, Jim Elliot, George Müller
- C.S. Lewis, Dietrich Bonhoeffer, Corrie ten Boom
- And more...

## Tech Stack

- **Framework**: Next.js 16 (React)
- **AI Providers**: Gemini, Groq, Hugging Face, Together AI
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own spiritual research needs.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for the builders and seekers of truth.
