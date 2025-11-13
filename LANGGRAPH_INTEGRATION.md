# LangGraph Email Agent - Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Frontend Integration](#frontend-integration)
4. [Backend Requirements](#backend-requirements)
5. [Testing the Agent](#testing-the-agent)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The LangGraph Email Agent is an AI-powered assistant that:
- **Understands natural language**: "Send that I'm on leave for 5 days to my manager and colleagues"
- **Automatically finds recipients**: Matches contacts based on their relation (manager, colleague, etc.)
- **Adapts tone**: Formal for managers, appropriate for colleagues
- **Sends personalized emails**: Each recipient gets a customized message

### Architecture Flow
```
User Input → LangGraph Server (Port 8001)
    ↓
1. Fetch contacts from Django backend
2. Analyze intent using Google Gemini
3. Compose personalized emails
4. Send via Django backend
    ↓
Result: Multiple emails sent with appropriate tones
```

---

## 🚀 Setup Instructions

### Step 1: Configure Google API Key

1. Get your Google API key from: https://aistudio.google.com/app/apikey
2. Open `langgraph_server\.env` file
3. Replace the placeholder with your actual key:

```env
GOOGLE_API_KEY=AIzaSy...your_actual_key_here
BACKEND_URL=http://127.0.0.1:8000
```

### Step 2: Verify Django Backend

Ensure your Django backend has these endpoints working:
- `GET /contactapi/contacts/` - Returns user's contacts
- `POST /gmailapi/send/` - Sends emails

### Step 3: Start All Services

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

You should see:
```
============================================================
🚀 Starting LangGraph Email Agent Server
============================================================
📍 API Documentation: http://localhost:8001/docs
📍 Health Check: http://localhost:8001/health
📍 Agent Endpoint: http://localhost:8001/agent/send-email
============================================================
```

### Step 4: Verify Server Health

Visit http://localhost:8001/health in your browser. You should see:
```json
{
  "status": "healthy",
  "google_api_configured": true
}
```

---

## 🎨 Frontend Integration

### Option 1: Add AI Agent Section to Email Component

Add this to your `EmailDisplay.jsx` or create a new `AIEmailAgent.jsx` component:

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const AIEmailAgent = ({ user, onSuccess }) => {
  const [agentMessage, setAgentMessage] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState(null);
  const [agentSuccess, setAgentSuccess] = useState(null);

  const handleAgentSend = async () => {
    if (!agentMessage.trim()) return;
    
    setAgentLoading(true);
    setAgentError(null);
    setAgentSuccess(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://127.0.0.1:8001/agent/send-email', {
        message: agentMessage,
        user_token: token,
        user_id: user.id
      });
      
      setAgentSuccess(`✓ Agent sent ${response.data.emails_sent} emails successfully!`);
      setAgentMessage('');
      
      // Call parent component's refresh function if provided
      if (onSuccess) onSuccess();
      
      // Clear success message after 5 seconds
      setTimeout(() => setAgentSuccess(null), 5000);
    } catch (error) {
      console.error('Agent error:', error);
      setAgentError(error.response?.data?.detail || 'Failed to send emails. Please try again.');
    } finally {
      setAgentLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 mb-4">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span>🤖</span> AI Email Agent
      </h3>
      <p className="text-sm text-gray-300 mb-4">
        Just tell me what to send and to whom. I'll handle the rest!
      </p>
      
      {/* Examples */}
      <div className="mb-4 space-y-2">
        <p className="text-xs text-gray-400">Examples:</p>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setAgentMessage("Send that I'm on leave for 5 days to my manager and colleagues")}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full transition-colors"
          >
            Leave notification
          </button>
          <button 
            onClick={() => setAgentMessage("Tell my manager I'll be late tomorrow")}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full transition-colors"
          >
            Late notification
          </button>
          <button 
            onClick={() => setAgentMessage("Send meeting notes to all colleagues")}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full transition-colors"
          >
            Meeting notes
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <textarea
          placeholder="E.g., 'Send that I'm on leave for 5 days to my manager and colleagues'"
          className="w-full bg-slate-700 rounded-xl p-3 outline-none text-white resize-none"
          rows="3"
          value={agentMessage}
          onChange={e => setAgentMessage(e.target.value)}
          disabled={agentLoading}
        />
        
        {/* Error/Success Messages */}
        {agentError && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
            {agentError}
          </div>
        )}
        
        {agentSuccess && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-200 text-sm">
            {agentSuccess}
          </div>
        )}
        
        {/* Send Button */}
        <button
          onClick={handleAgentSend}
          disabled={agentLoading || !agentMessage.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl px-6 py-3 font-semibold transition-all transform hover:scale-[1.02]"
        >
          {agentLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Send via AI Agent'
          )}
        </button>
      </div>
    </div>
  );
};

export default AIEmailAgent;
```

### Option 2: Add to Existing Page

In your `EmailDisplay.jsx` or `Home.jsx`:

```jsx
import AIEmailAgent from './AIEmailAgent'; // or include the component above

// Inside your component:
<AIEmailAgent 
  user={user} 
  onSuccess={() => {
    // Refresh emails or perform any action after successful send
    fetchEmails();
  }} 
/>
```

---

## 🔧 Backend Requirements

### Contact Model Requirements

Ensure your Contact model in Django has these fields:
```python
class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    relation = models.CharField(max_length=100)  # e.g., "manager", "colleague"
    tone = models.CharField(max_length=50)       # e.g., "formal", "casual", "professional"
```

### Contact API Endpoint

```python
# views.py in contact_api
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_contacts(request):
    contacts = Contact.objects.filter(user=request.user)
    serializer = ContactSerializer(contacts, many=True)
    return Response(serializer.data)
```

### Email Send Endpoint

Ensure your email send endpoint accepts:
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "Email body"
}
```

---

## 🧪 Testing the Agent

### Test 1: Basic Leave Request
```
Input: "Send that I'm on leave for 5 days to my manager"
Expected: Email sent to contact(s) with relation="manager" in formal tone
```

### Test 2: Multiple Recipients
```
Input: "Tell my manager and colleagues that I'll be late tomorrow"
Expected: Emails sent to manager (formal) and colleagues (professional)
```

### Test 3: Custom Message
```
Input: "Send meeting notes about Q4 planning to all colleagues"
Expected: Emails sent to all contacts with relation="colleague"
```

### Test via API (curl)
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    message = "Send that I'm on leave for 5 days to my manager"
    user_token = "your_jwt_token_here"
    user_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8001/agent/send-email" -Method Post -Headers $headers -Body $body
```

---

## 🔍 Troubleshooting

### Issue: "Google API not configured"
**Solution:** 
- Check `.env` file has correct `GOOGLE_API_KEY`
- Verify the key works at https://aistudio.google.com/app/apikey
- Restart the LangGraph server after updating `.env`

### Issue: "Cannot connect to backend"
**Solution:**
- Ensure Django is running on port 8000
- Check `BACKEND_URL` in `.env`
- Verify CORS is properly configured in Django

### Issue: "No contacts found"
**Solution:**
- Add contacts via your email client UI
- Ensure contacts have `relation` and `tone` fields set
- Check JWT token is valid

### Issue: "Emails not sending"
**Solution:**
- Verify Django email send endpoint works manually
- Check Google OAuth credentials are configured
- Review Django logs for email sending errors

### Issue: Port 8001 already in use
**Solution:**
```powershell
# Find process using port 8001
netstat -ano | findstr :8001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in main.py
uvicorn.run(app, host="0.0.0.0", port=8002)  # Use different port
```

---

## 📊 API Documentation

Once the server is running, visit:
- **Interactive Docs:** http://localhost:8001/docs
- **Alternative Docs:** http://localhost:8001/redoc

### Main Endpoint

**POST** `/agent/send-email`

**Request:**
```json
{
  "message": "Send that I'm on leave for 5 days to my manager and colleagues",
  "user_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "emails_sent": 3,
  "results": "✓ Sent to John Manager (john@company.com)\n✓ Sent to Jane Colleague (jane@company.com)\n✓ Sent to Bob Colleague (bob@company.com)",
  "emails_details": [
    {
      "to": "john@company.com",
      "to_name": "John Manager",
      "subject": "Leave Notification",
      "body": "Dear John,\n\nI hope this message finds you well...",
      "tone": "formal"
    }
  ]
}
```

**Response (Error):**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## 🎯 How It Works

### 1. **Fetch Contacts**
The agent retrieves all your contacts from the Django backend, including their relation and preferred tone.

### 2. **Analyze Intent**
Google's Gemini AI analyzes your natural language input to:
- Extract the core message
- Identify recipient types (manager, colleague, etc.)
- Determine appropriate subject line

### 3. **Compose Emails**
For each recipient, the AI:
- Adapts the message to their specific tone
- Adds proper salutation and closing
- Ensures professional formatting

### 4. **Send Emails**
The composed emails are sent through your Django backend's existing email API.

---

## 🔐 Security Notes

- **JWT Tokens:** All requests require valid JWT authentication
- **User Isolation:** Agent only accesses contacts of the authenticated user
- **API Key:** Google API key is stored server-side, not exposed to frontend
- **Rate Limiting:** Consider adding rate limiting in production

---

## 📈 Future Enhancements

- [ ] Add conversation history/context
- [ ] Support for email templates
- [ ] Scheduled email sending
- [ ] Email priority detection
- [ ] Multi-language support
- [ ] Attachment handling
- [ ] Email tracking and analytics

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `langgraph_server` terminal output
3. Visit interactive API docs: http://localhost:8001/docs
4. Check Django backend logs for backend-related issues

---

## 📝 License

This LangGraph agent integrates with your existing SuperMail project and follows the same license.

---

**Happy emailing with AI! 🚀**
