# Backend-LangGraph Integration

This document explains how the Django backend connects to the LangGraph server to enable AI-powered email sending.

## Architecture

```
Frontend (React) → Django Backend → LangGraph Server → AI Processing
                                      ↓
                               Django APIs (contacts, send email)
```

## Components

### 1. Django API (`agent_api`)

**Location:** `backend/agent_api/`

**Endpoints:**

- **POST** `/agent/send/` - Send email using AI agent
  - Request: `{"message": "send that I'm on leave to my manager"}`
  - Response: `{"success": true, "emails_sent": 2, "recipients": ["Manager", "HR"]}`
  - Requires: JWT authentication token

- **GET** `/agent/health/` - Check LangGraph server status
  - Response: `{"status": "healthy", "langgraph_server": "connected"}`

### 2. LangGraph Server

**Location:** `langgraph_server/`

**How it works:**
- When you run `langgraph dev`, it automatically starts an API server on port 2024
- The server exposes your graph defined in `graph.py` 
- Django calls the LangGraph API at `http://127.0.0.1:2024/runs/stream`

### 3. Frontend Hook

**Location:** `frontend/src/hooks/useEmailAgent.jsx`

React hook that provides:
- `sendWithAgent(message)` - Send email with natural language
- `checkAgentHealth()` - Check if agent is available
- `loading`, `error`, `result` - State management

## Setup Instructions

### 1. Start the LangGraph Server

```powershell
cd langgraph_server
langgraph dev
```

This will start the server on port 2024.

### 2. Start Django Backend

```powershell
cd backend
python manage.py runserver
```

This will start Django on port 8000.

### 3. Start Frontend

```powershell
cd frontend
npm run dev
```

This will start React on port 5173.

## How It Works

### Step 1: User Input (Frontend)
User types: "Send that I'm on leave for 5 days to my manager and colleagues"

### Step 2: Frontend → Django
```javascript
axios.post('http://localhost:8000/agent/send/', 
  { message: userInput },
  { headers: { Authorization: 'Bearer JWT_TOKEN' }}
)
```

### Step 3: Django → LangGraph
```python
requests.post('http://127.0.0.1:2024/runs/stream',
  json={
    "assistant_id": "email_agent",
    "input": {
      "user_input": message,
      "user_token": jwt_token,
      "user_id": user_id
    }
  }
)
```

### Step 4: LangGraph Processing
The graph executes:
1. **fetch_contacts** - Get contacts from Django `/contactapi/contacts/`
2. **analyze_intent** - AI analyzes message and matches recipients
3. **compose_emails** - AI composes personalized emails for each recipient
4. **send_emails** - Send via Django `/gmailapi/send/`

### Step 5: Response
Django returns:
```json
{
  "success": true,
  "message": "✓ Sent to Manager (manager@company.com)\n✓ Sent to Colleague (colleague@company.com)",
  "emails_sent": 2,
  "recipients": ["Manager", "Colleague"]
}
```

## Configuration

### Environment Variables

**Backend** (`backend/.env.local`):
```bash
LANGGRAPH_URL=http://127.0.0.1:2024
```

**LangGraph Server** (`langgraph_server/.env`):
```bash
GOOGLE_API_KEY=your_google_api_key_here
BACKEND_URL=http://127.0.0.1:8000
```

## API Details

### Django Endpoint: POST /agent/send/

**Request:**
```json
{
  "message": "Natural language instruction"
}
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✓ Sent to Manager\n✓ Sent to Colleague",
  "emails_sent": 2,
  "recipients": ["Manager Name", "Colleague Name"]
}
```

**Response (Error):**
```json
{
  "error": "Cannot connect to LangGraph server",
  "help": "Make sure LangGraph server is running with 'langgraph dev'"
}
```

### LangGraph Endpoint: POST /runs/stream

**Request:**
```json
{
  "assistant_id": "email_agent",
  "input": {
    "user_input": "send message",
    "user_token": "jwt_token",
    "user_id": 1,
    "messages": []
  },
  "stream_mode": "values"
}
```

**Response:**
Streaming response with state updates at each node execution.

## Troubleshooting

### Error: "Cannot connect to LangGraph server"

**Solution:**
```powershell
cd langgraph_server
langgraph dev
```

Make sure the server starts successfully and shows:
```
LangGraph API running on http://127.0.0.1:2024
```

### Error: "Cannot connect to backend server"

**Solution:**
```powershell
cd backend
python manage.py runserver
```

### Error: 429 - Rate Limit Exceeded

**Cause:** Google Gemini API rate limit on free tier

**Solutions:**
1. Wait a few minutes before trying again
2. Upgrade to paid Google AI tier
3. Add retry logic with exponential backoff

### Error: "Authentication token not found"

**Solution:** Make sure user is logged in and JWT token is saved in localStorage.

## Testing

### Test Health Check
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/agent/health/
```

### Test Agent
```bash
curl -X POST http://localhost:8000/agent/send/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "send that I am on leave to my manager"}'
```

## Frontend Usage

```jsx
import useEmailAgent from '../hooks/useEmailAgent';

function MyComponent() {
  const { sendWithAgent, loading, error, result } = useEmailAgent();

  const handleSend = async () => {
    try {
      const response = await sendWithAgent(
        "Send that I'm on leave for 5 days to my manager"
      );
      console.log('Success:', response);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {result && <div>Success: {result.message}</div>}
    </div>
  );
}
```

## Security Notes

1. **JWT Authentication:** All endpoints require valid JWT token
2. **CORS:** Django CORS is configured to allow frontend on port 5173
3. **Token Forwarding:** User's JWT token is forwarded to LangGraph for backend API calls
4. **API Keys:** Google API key is stored in `.env` file (not committed to git)

## Next Steps

1. Add approval workflow (human-in-the-loop)
2. Add conversation history/memory
3. Add more AI capabilities (scheduling, attachments)
4. Add rate limiting and caching
5. Deploy to production with proper security
