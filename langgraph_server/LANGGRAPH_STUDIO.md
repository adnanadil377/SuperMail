# LangGraph Email Agent - Studio Mode

## 🎨 LangGraph Studio Setup

This project now supports **LangGraph Studio** for visual debugging and development!

### What is LangGraph Studio?

LangGraph Studio is a visual development environment that allows you to:
- 🔍 **Visualize** your graph workflow in real-time
- 🐛 **Debug** step-by-step execution
- 📊 **Monitor** state changes at each node
- 🎮 **Test** interactively with different inputs
- 📝 **Trace** the AI's reasoning process

## 🚀 Quick Start

### Option 1: LangGraph Studio (Visual Development) - **Recommended**

```powershell
# 1. Install LangGraph CLI
pip install -U langgraph-cli

# 2. Start LangGraph Studio
cd langgraph_server
langgraph dev
```

Then open: **http://localhost:8123**

You'll see:
- Visual graph representation
- Interactive input panel
- Real-time execution tracing
- State inspector at each node

### Option 2: FastAPI Server (Production Mode)

```powershell
cd langgraph_server
python main.py
```

API available at: **http://localhost:8001**

## 📁 Project Structure

```
langgraph_server/
├── langgraph.json      # LangGraph Studio configuration
├── graph.py            # Main graph definition (Studio entry point)
├── server.py           # Graph execution wrapper
├── main.py             # FastAPI server (production)
├── agent.py            # Legacy agent code (backup)
├── requirements.txt    # Dependencies
├── .env                # Configuration (API keys)
└── AIEmailAgent.jsx    # React component
```

## 🎯 Using LangGraph Studio

### 1. Start Studio
```powershell
cd langgraph_server
langgraph dev
```

### 2. Open Browser
Navigate to: http://localhost:8123

### 3. Test Your Graph

**Input Format:**
```json
{
  "messages": [],
  "user_input": "Send that I'm on leave for 5 days to my manager",
  "contacts": [],
  "intent": {},
  "emails_to_send": [],
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

**Simplified Test (Studio will auto-populate):**
```json
{
  "user_input": "Send that I'm on leave for 5 days to my manager",
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

### 4. Watch the Magic! ✨

You'll see the graph execute through each node:
1. **fetch_contacts** - Retrieves contacts from backend
2. **analyze_intent** - AI analyzes the request
3. **compose_emails** - AI writes personalized emails
4. **send_emails** - Sends via Django backend

Each step shows:
- Input state
- Node execution
- Output state
- Any errors or logs

## 🔧 Configuration

### langgraph.json

```json
{
  "dependencies": ["."],
  "graphs": {
    "email_agent": "./graph.py:graph"
  },
  "env": ".env"
}
```

- **dependencies**: Python packages to install
- **graphs**: Points to your graph export
- **env**: Environment variables file

### Environment Variables

`.env` file:
```env
GOOGLE_API_KEY=your_api_key_here
BACKEND_URL=http://127.0.0.1:8000
```

## 🎮 Development Workflow

### 1. Visual Development (LangGraph Studio)

```powershell
# Start Studio
langgraph dev

# Edit graph.py
# Changes auto-reload in Studio
# Test immediately with visual feedback
```

### 2. Production Deployment

```powershell
# Start FastAPI server
python main.py

# Or deploy as Docker container
# Or use LangGraph Cloud
```

## 🌟 Features

### LangGraph Studio Mode
- ✅ Visual graph editor
- ✅ Step-by-step debugging
- ✅ State inspection
- ✅ Interactive testing
- ✅ Hot reload
- ✅ Execution tracing

### Production API Mode
- ✅ FastAPI REST API
- ✅ CORS enabled
- ✅ OpenAPI docs
- ✅ Health checks
- ✅ Error handling

## 📊 Graph Visualization

In LangGraph Studio, you'll see this flow:

```
START
  ↓
[fetch_contacts]
  ↓
[analyze_intent] ← Google Gemini AI
  ↓
[compose_emails] ← Google Gemini AI
  ↓
[send_emails]
  ↓
END
```

Each node is clickable and shows:
- Input/Output state
- Execution time
- Logs and prints
- Error traces

## 🧪 Testing Examples

### Example 1: Leave Request
```json
{
  "user_input": "Send that I'm on leave for 5 days to my manager and colleagues",
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

**Expected Flow:**
1. Fetches contacts → finds 1 manager, 2 colleagues
2. Analyzes intent → extracts "5 days leave"
3. Composes → formal email for manager, friendly for colleagues
4. Sends → 3 emails sent

### Example 2: Late Notice
```json
{
  "user_input": "Tell my manager I'll be late tomorrow",
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

**Expected Flow:**
1. Fetches contacts → finds manager
2. Analyzes intent → "late tomorrow"
3. Composes → short formal notification
4. Sends → 1 email sent

## 🔗 Integration with Frontend

The React component works with both modes!

### Studio Mode (Development)
```jsx
// Points to Studio API
const STUDIO_URL = "http://localhost:8123";

// Or proxy through FastAPI
const API_URL = "http://localhost:8001/agent/send-email";
```

### Production Mode
```jsx
const API_URL = "http://localhost:8001/agent/send-email";
```

## 📦 Deployment Options

### 1. Local Development
```powershell
langgraph dev  # Studio at :8123
# OR
python main.py # API at :8001
```

### 2. Docker Container
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### 3. LangGraph Cloud
```powershell
langgraph deploy
```

## 🐛 Debugging

### Studio Mode (Visual Debugging)
1. Set breakpoints in graph visualization
2. Inspect state at each node
3. See AI prompts and responses
4. Trace execution path
5. View timing information

### API Mode (Log Debugging)
```powershell
# Enable debug logging
python main.py

# Check logs
# Look for ✓ and ✗ markers in output
```

## 📈 Performance Monitoring

In Studio, you can see:
- ⏱️ Time per node
- 📊 State size at each step
- 🔄 Number of LLM calls
- 💰 Token usage (if configured)

## 🔐 Security Notes

- 🔑 API keys stored in `.env` (not committed)
- 🔒 JWT authentication required
- 🚫 User isolation enforced
- 🛡️ CORS properly configured

## 🆚 Studio vs API Mode

| Feature | Studio Mode | API Mode |
|---------|-------------|----------|
| Visual Debugging | ✅ | ❌ |
| Interactive Testing | ✅ | Via /docs |
| Hot Reload | ✅ | ❌ |
| Production Ready | ⚠️ Dev only | ✅ |
| REST API | ✅ (built-in) | ✅ |
| Tracing | ✅ Visual | Logs only |
| Port | 8123 | 8001 |

## 💡 Pro Tips

1. **Use Studio for Development**: Visual feedback is invaluable
2. **Test Edge Cases**: Try unusual inputs in Studio
3. **Monitor State Size**: Keep it manageable
4. **Check Logs**: Studio shows all print statements
5. **Hot Reload**: Edit graph.py and see changes instantly

## 🚨 Troubleshooting

### "langgraph command not found"
```powershell
pip install -U langgraph-cli
```

### "Graph not found"
Check `langgraph.json` points to correct file:
```json
"graphs": {
  "email_agent": "./graph.py:graph"
}
```

### "Cannot connect to backend"
Ensure Django is running:
```powershell
cd ../backend
python manage.py runserver
```

### Studio won't start
```powershell
# Check port 8123 is free
netstat -ano | findstr :8123

# Try different port
langgraph dev --port 8124
```

## 📚 Resources

- **LangGraph Docs**: https://python.langchain.com/docs/langgraph
- **LangGraph Studio**: https://github.com/langchain-ai/langgraph-studio
- **LangSmith**: https://smith.langchain.com (for tracing)

## 🎓 Next Steps

1. ✅ Start LangGraph Studio: `langgraph dev`
2. ✅ Test with different inputs
3. ✅ Modify graph.py and see live updates
4. ✅ Deploy to production: `python main.py`
5. ✅ Integrate with your frontend

---

**Happy coding with LangGraph Studio! 🚀**

For the old FastAPI-only mode, see `agent.py` (legacy backup).
