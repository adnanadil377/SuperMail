# 🚀 Quick Start Guide - LangGraph Email Agent (Studio Mode)

## ✅ What's Been Created

Your LangGraph server has been successfully created with **LangGraph Studio** support in the `langgraph_server` directory with:

```
langgraph_server/
├── langgraph.json       # Studio configuration  
├── graph.py             # Main graph (Studio entry point) ⭐
├── server.py            # Graph execution wrapper
├── main.py              # FastAPI server entry point
├── agent.py             # Legacy backup
├── requirements.txt     # Python dependencies (✓ installed)
├── .env                 # Environment configuration
├── test_setup.py        # Setup verification script
├── AIEmailAgent.jsx     # React component example
├── LANGGRAPH_STUDIO.md  # Studio documentation
├── MIGRATION.md         # What changed and why
├── start_studio.ps1     # Quick start for Studio
├── README.md            # Complete documentation
└── .gitignore          # Git ignore rules
```

## 🎯 Two Ways to Run (Choose Your Adventure)

### Option 1: LangGraph Studio (Visual Development) ⭐ **RECOMMENDED**

The best way to develop and debug your agent!

```powershell
cd langgraph_server
langgraph dev
```

Then open: **http://localhost:8123**

**What you get:**
- 🎨 Visual graph representation
- 🐛 Step-by-step debugging  
- 📊 Real-time state inspection
- ⚡ Hot reload when you edit code
- 🔍 See AI prompts and responses
- 📈 Execution timing and tracing

### Option 2: FastAPI Server (Production API)

For production deployment:

```powershell
cd langgraph_server
python main.py
```

API available at: **http://localhost:8001**

---

## 🎯 Next Steps (2 minutes)

### Step 1: Get Google API Key (1 minute)
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Configure Environment (30 seconds)
Open `langgraph_server\.env` and paste your API key:
```env
GOOGLE_API_KEY=AIzaSy...your_key_here
BACKEND_URL=http://127.0.0.1:8000
```

### Step 3: Start the Server (30 seconds)
```powershell
cd langgraph_server
python main.py
```

You should see:
```
🚀 Starting LangGraph Email Agent Server
📍 API Documentation: http://localhost:8001/docs
📍 Health Check: http://localhost:8001/health
```

## 🧪 Verify Setup

Run the test script:
```powershell
cd langgraph_server
python test_setup.py
```

All checks should pass ✓

## 🎨 Add to Your Frontend

### Option 1: Quick Integration
Copy `AIEmailAgent.jsx` to your `frontend/src/components/` folder:
```powershell
Copy-Item langgraph_server\AIEmailAgent.jsx frontend\src\components\
```

Then use it in any page:
```jsx
import AIEmailAgent from './components/AIEmailAgent';

// Inside your component:
<AIEmailAgent user={user} onSuccess={() => fetchEmails()} />
```

### Option 2: Add to Existing Component
Add this to your `EmailDisplay.jsx` or `Home.jsx`:

```jsx
const [agentMessage, setAgentMessage] = useState('');
const [agentLoading, setAgentLoading] = useState(false);

const handleAgentSend = async () => {
  setAgentLoading(true);
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.post('http://127.0.0.1:8001/agent/send-email', {
      message: agentMessage,
      user_token: token,
      user_id: user.id
    });
    alert(`✓ Sent ${response.data.emails_sent} emails!`);
  } catch (error) {
    console.error(error);
    alert('Failed to send emails');
  } finally {
    setAgentLoading(false);
  }
};

// In your JSX:
<div>
  <textarea 
    value={agentMessage} 
    onChange={e => setAgentMessage(e.target.value)}
    placeholder="E.g., Send that I'm on leave for 5 days to my manager"
  />
  <button onClick={handleAgentSend} disabled={agentLoading}>
    {agentLoading ? 'Processing...' : 'Send via AI Agent'}
  </button>
</div>
```

## 💡 Example Usage

Try these commands:
- "Send that I'm on leave for 5 days to my manager and colleagues"
- "Tell my manager I'll be late tomorrow"
- "Send meeting notes to all colleagues"

The AI will:
1. ✓ Find contacts by relation (manager, colleague)
2. ✓ Use appropriate tone for each person
3. ✓ Compose personalized emails
4. ✓ Send through your Django backend

## 📊 Running All Services

**Terminal 1 - Django Backend:**
```powershell
cd backend
python manage.py runserver
```

**Terminal 2 - React Frontend:**
```powershell
cd frontend
npm run dev
```

**Terminal 3 - LangGraph Server:**
```powershell
cd langgraph_server
python main.py
```

## 🔍 API Testing

Test directly with PowerShell:
```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    message = "Send that I'm on leave for 5 days to my manager"
    user_token = "your_jwt_token"
    user_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8001/agent/send-email" -Method Post -Headers $headers -Body $body
```

Or visit: http://localhost:8001/docs for interactive testing

## 📋 Requirements

Your contacts need these fields:
- `name`: Contact's name
- `email`: Contact's email
- `relation`: "manager", "colleague", etc.
- `tone`: "formal", "professional", "casual"

Add them via your email client UI or Django admin.

## 🐛 Troubleshooting

### "Google API key not configured"
→ Update `GOOGLE_API_KEY` in `.env` file

### "Cannot connect to backend"
→ Start Django: `python manage.py runserver`

### "LangGraph server not running"
→ Start server: `cd langgraph_server && python main.py`

### Port 8001 already in use
→ Kill process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess | Stop-Process -Force`

## 📚 Documentation

- **Full Integration Guide:** `LANGGRAPH_INTEGRATION.md` (in root directory)
- **Server README:** `langgraph_server/README.md`
- **API Docs (when running):** http://localhost:8001/docs

## 🎓 How It Works

```
User: "Send that I'm on leave for 5 days to my manager and colleagues"
  ↓
LangGraph Agent:
  1. Fetches your contacts from Django
  2. AI analyzes: needs to email manager + colleagues
  3. AI composes: formal email for manager, professional for colleagues
  4. Sends via Django backend
  ↓
Result: 3 personalized emails sent with appropriate tones ✓
```

## 🎯 What Makes This Special

✨ **Natural Language**: No forms, just describe what you want
✨ **Smart Matching**: Finds recipients by their role/relation
✨ **Tone Aware**: Formal for managers, casual for friends
✨ **Fully Automated**: From intent to sent emails in seconds
✨ **Integrated**: Uses your existing contacts and email system

## 🚀 Ready to Go!

1. ✓ Dependencies installed
2. ⏳ Add Google API key to `.env`
3. ⏳ Start the server with `python main.py`
4. ⏳ Add the React component to your frontend
5. 🎉 Start sending emails with AI!

---

**Need help?** Check the full documentation in `LANGGRAPH_INTEGRATION.md`

**Questions?** The setup test shows what needs to be configured: `python test_setup.py`
