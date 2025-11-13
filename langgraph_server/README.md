# LangGraph Email Agent - Studio Mode

AI-powered email agent with visual development using LangGraph Studio.

## 🚀 Quick Start

```powershell
# Start LangGraph Studio
langgraph dev
```

Opens at: **https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024**

## 📁 Project Files

```
langgraph_server/
├── graph.py            # Main graph definition (Studio entry point)
├── server.py           # Execution wrapper
├── langgraph.json      # Studio configuration
├── requirements.txt    # Dependencies
├── .env                # API keys
├── start_studio.ps1    # Quick launcher
└── README.md           # This file
```

## ⚙️ Configuration

Edit `.env`:
```env
GOOGLE_API_KEY=your_api_key_here
BACKEND_URL=http://127.0.0.1:8000
```

Get your API key: https://aistudio.google.com/app/apikey

## 🎯 How It Works

1. **fetch_contacts** - Gets contacts from Django backend
2. **analyze_intent** - AI analyzes your request
3. **compose_emails** - AI writes personalized emails  
4. **send_emails** - Sends via Django backend

## 🧪 Test in Studio

Input format:
```json
{
  "user_input": "Send that I'm on leave for 5 days to my manager",
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

## 📚 Documentation

- **LANGGRAPH_STUDIO.md** - Complete Studio guide
- **MIGRATION.md** - What changed from old version

## 🔧 Requirements

- Python 3.11+
- LangGraph CLI: `pip install -U "langgraph-cli[inmem]"`
- Django backend running on port 8000
- Valid Google API key

## ✨ Features

- 🎨 Visual graph debugging
- 🔍 Step-by-step execution tracing
- ⚡ Hot reload on code changes
- 📊 Real-time state inspection
- 🤖 Powered by Google Gemini AI

---

**Start developing:** `langgraph dev`
