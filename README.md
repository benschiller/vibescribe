# 🎵 VibeScribe

> **Cerebras x Cline Hackathon Entry**  
> AI-powered audio transcription built with Qwen3 Coder and Deepgram

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)]() 
[![Built with](https://img.shields.io/badge/Built%20with-Qwen3%20Coder-blue)]()
[![Powered by](https://img.shields.io/badge/Powered%20by-Deepgram-purple)]()

Transform your audio files into accurate text transcriptions with our AI-powered web application. Built for the **Cerebras x Cline Hackathon** showcasing the power of AI-assisted development.

## ✨ Features

- **🎯 Drag & Drop Interface** - Simply drag audio files onto the upload area
- **⚡ Real-time Processing** - Watch your transcription progress in real-time
- **📝 Smart Transcription** - Powered by Deepgram's Nova-3 model with:
  - Automatic language detection
  - Speaker diarization
  - Smart formatting
- **💾 Download Results** - Get your transcription as a .txt file
- **📱 Responsive Design** - Beautiful dark theme that works on all devices
- **🔄 Async Processing** - Handle large audio files without timeouts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Deepgram API key ([Get yours here](https://deepgram.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/benschiller/vibescribe.git
   cd vibescribe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Deploy to get webhook URL** (Required first)
   ```bash
   # Push to GitHub and deploy to Vercel to get your PUBLIC_URL
   # Or use ngrok for local development: ngrok http 3000
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file with your keys
   echo "DEEPGRAM_API_KEY=your_deepgram_api_key_here" > .env
   echo "PORT=3000" >> .env
   echo "PUBLIC_URL=https://your-vercel-app.vercel.app" >> .env
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Configuration

**Important**: PUBLIC_URL is required for Deepgram webhooks, even in development.

Create a `.env` file in the root directory:

```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
PORT=3000
PUBLIC_URL=https://your-vercel-app.vercel.app
```

### Development Options
- **Option 1**: Deploy to Vercel first, then develop locally with that webhook URL
- **Option 2**: Use ngrok (`ngrok http 3000`) and set PUBLIC_URL to the ngrok URL

## 🏗️ Architecture

### Backend (`server.js`)
- **Express.js** server with file upload handling
- **Multer** for multipart form data processing  
- **Deepgram SDK** for speech-to-text transcription
- **Async webhook processing** for handling large files
- **In-memory storage** for stateless deployment

### Frontend (`public/`)
- **Vanilla JavaScript** for maximum performance
- **Drag & drop** file upload interface
- **Real-time polling** for transcription status
- **Responsive CSS** with glassmorphism design
- **Progressive enhancement** for better UX

### Key Features Implementation

#### 🎯 Async Processing Flow
1. File uploaded via drag & drop or file picker
2. Server validates and forwards to Deepgram API
3. Webhook receives transcription results
4. Client polls for completion status
5. Results displayed in dedicated transcript page

#### 🔒 Security Features
- File type validation (audio files only)
- Environment variable configuration
- Memory-only file storage
- Comprehensive `.gitignore` patterns

## 📋 Supported Audio Formats

- **MP3** - Most common format
- **WAV** - Uncompressed audio
- **FLAC** - Lossless compression
- **M4A** - Apple format
- **AAC** - Advanced Audio Coding
- **OGG** - Open source format
- **WEBM** - Web audio format

## 🎯 Hackathon Story

This project was **entirely built using AI assistance** as part of the Cerebras x Cline Hackathon:

### 🤖 AI Development Process
- **Qwen3 Coder** provided architectural guidance and code generation
- **Cline** coding agent with direct access to frontier models
- **AI pair programming** for rapid prototyping and feature development
- **Iterative refinement** through AI-human collaboration

### 🏆 Technical Achievements
- **Zero-to-deployment** in minimal time using AI assistance
- **Production-ready** architecture with async processing
- **Responsive UI/UX** designed and implemented with AI guidance
- **Security-first** approach with comprehensive review

### 💡 Innovation Highlights
- **Webhook-based processing** for handling large audio files
- **Real-time status updates** with elegant loading states
- **Glassmorphism design** for modern visual appeal
- **Stateless architecture** perfect for serverless deployment

## 🙏 Acknowledgments

- **Cerebras** for hosting the hackathon
- **Cline** for the collaboration platform  
- **Qwen3 Coder** for AI development assistance
- **Deepgram** for world-class speech-to-text API

---

**Built with ❤️ and AI for the Cerebras x Cline Hackathon**
