# 🚀 SuperMail - Conversational SuperMail Agent - Complete Guide

## What Changed?

Your SuperMail Agent now has **conversational intelligence**! Instead of directly sending emails, it:

1. **Asks clarifying questions** when information is missing
2. **Shows a preview** of all emails before sending
3. **Waits for your approval** before actually sending

## 🔄 New Workflow

### Before (Old Flow)
```
User: "Send leave to manager" → 📤 Emails sent immediately
```

### After (New Flow)
```
User: "Send that I'm on leave for 5 days to my manager"
  ↓
Agent: "What date will your leave start?"
  ↓
User: "From December 15th"
  ↓
Agent: Shows preview of emails
  ↓
User: Clicks "Send All Emails"
  ↓
📤 Emails sent
```

## 📁 Files Modified

### 1. Backend - `langgraph_server/graph.py`

**New State Fields:**
```python
missing_info: list  # Questions that need answers
conversation_complete: bool  # All info collected?
awaiting_approval: bool  # Waiting for user to approve?
```

**New Nodes:**
- `check_missing_info` - Asks follow-up questions
- `create_preview` - Shows email preview for approval

**New Flow:**
```
fetch_contacts → analyze_intent → [check_missing_info OR compose_emails] 
→ create_preview → [wait for approval] → send_emails
```

### 2. Backend API - `backend/agent_api/views.py`

**Enhanced `/agent/send/` endpoint:**

**New Request Fields:**
```json
{
  "message": "user message",
  "thread_id": "conversation-id",  // For continuity
  "action": "continue" | "send" | "cancel"
}
```

**New Response Types:**

**1. Needs More Info:**
```json
{
  "status": "needs_info",
  "message": "What date will your leave start?",
  "thread_id": "user_1",
  "needs_response": true
}
```

**2. Awaiting Approval:**
```json
{
  "status": "awaiting_approval",
  "message": "📧 Email Preview - Review before sending...",
  "emails_preview": [
    {
      "to": "manager@company.com",
      "to_name": "Manager",
      "subject": "Leave Application",
      "body": "Dear Manager,\n\nI am writing...",
      "tone": "formal"
    }
  ],
  "thread_id": "user_1",
  "needs_action": true,
  "actions": ["send", "cancel", "edit"]
}
```

**3. Complete:**
```json
{
  "status": "complete",
  "success": true,
  "message": "✓ Sent to Manager\n✓ Sent to Colleague",
  "emails_sent": 2,
  "recipients": ["Manager", "Colleague"]
}
```

### 3. Frontend - `frontend/src/components/AIEmailAgentV2.jsx`

**New Features:**
- 💬 **Conversation history** display
- 📧 **Email preview cards** with formatting
- ✅ **Approval buttons** (Send/Cancel)
- 🔄 **Thread-based conversation** continuity

**New State:**
```javascript
const [conversation, setConversation] = useState([]);
const [threadId, setThreadId] = useState(null);
const [awaitingApproval, setAwaitingApproval] = useState(false);
const [emailsPreview, setEmailsPreview] = useState([]);
```

## 🚀 How to Use

### Step 1: Start All Servers

```powershell
.\start_all.ps1
```

Or manually:
```powershell
# Terminal 1 - Django
cd backend
python manage.py runserver

# Terminal 2 - LangGraph
cd langgraph_server
langgraph dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### Step 2: Use the New Component

**Option A: Replace old component**
```jsx
// In your route/page file
import AIEmailAgent from './components/AIEmailAgentV2';

// Use it
<AIEmailAgent user={user} onSuccess={handleSuccess} />
```

**Option B: Test both versions**
Keep both files and test AIEmailAgentV2.jsx first.

### Step 3: Try It Out!

**Example Conversation:**

**You:** "Send that I'm on leave for 5 days to my manager and colleagues"

**Agent:** "What date will your leave start?"

**You:** "From December 15th"

**Agent:** *Shows preview of 3 emails with subjects, bodies, etc.*

**You:** *Clicks "Send All Emails"*

**Agent:** "✅ Successfully sent 3 emails to: Manager, Colleague1, Colleague2"

## 🎨 UI Features

### Conversation Display
- User messages on the right (blue)
- Agent messages on the left (green)
- Scrollable conversation history

### Email Preview Cards
- Shows each email in a separate card
- Displays: recipient, subject, body, tone
- Color-coded by tone (formal, casual, etc.)
- Scrollable if many emails

### Approval Section
- Green "Send All Emails" button
- Red "Cancel" button
- Loading state while sending

## 🔧 Configuration

### Adjust AI Behavior

In `graph.py`, modify the `analyze_intent` prompt to control:

**What questions to ask:**
```python
"missing_info": [
    {
        "field": "start_date",
        "question": "What date will your leave start?",
        "importance": "critical"  // "critical" or "optional"
    }
]
```

**When to ask:**
- "critical" = Always ask if missing
- "optional" = Don't ask unless needed

### Email Preview Format

Customize in `create_preview()`:
```python
preview_text = "📧 **Email Preview** - Review before sending:\n\n"
# Modify this format as needed
```

## 🧪 Testing Scenarios

### Scenario 1: Missing Dates
**Input:** "Send that I'm on leave to my manager"
**Expected:** Agent asks for start date and duration

### Scenario 2: Complete Info
**Input:** "Send that I'm on leave from Dec 15-20 to my manager"
**Expected:** Skips questions, shows preview directly

### Scenario 3: Multiple Recipients
**Input:** "Send meeting notes to my manager and all colleagues"
**Expected:** Shows preview with multiple emails

### Scenario 4: User Cancels
**User:** *Clicks "Cancel" button*
**Expected:** Clears conversation, no emails sent

## 🔍 Debugging

### Check Conversation State

Add to frontend:
```jsx
console.log('Conversation:', conversation);
console.log('Thread ID:', threadId);
console.log('Awaiting Approval:', awaitingApproval);
```

### Check Backend Logs

Django terminal will show:
```
📡 Calling LangGraph at http://127.0.0.1:2024/runs/stream
📝 Input: user message (action: continue)
```

LangGraph terminal will show:
```
🔍 Checking for missing information...
  ❓ Asking user: What date will your leave start?
```

Or:
```
👀 Creating email preview...
  ✓ Preview created for 2 emails
```

### Common Issues

**Issue:** "Thread not found"
**Fix:** Thread IDs expire after some time. Just start a new conversation.

**Issue:** Questions not showing
**Fix:** Check that `conversation_complete` is False in state

**Issue:** Preview not showing
**Fix:** Check that `awaiting_approval` is True and `emails_preview` has data

## 🎯 Advanced Customization

### Add More Question Types

In `analyze_intent()`:
```python
"missing_info": [
    {
        "field": "cc_recipients",
        "question": "Should anyone else be CC'd on this email?",
        "importance": "optional"
    },
    {
        "field": "attachments",
        "question": "Do you want to attach any documents?",
        "importance": "optional"
    }
]
```

### Custom Approval Logic

Add to `send_emails()`:
```python
# Before sending, check some condition
if email['to_name'] == 'CEO':
    # Require additional approval
    pass
```

### Save Conversation History

In backend, save to database:
```python
from django.core.cache import cache

# Save conversation
cache.set(f"conversation_{thread_id}", conversation_data, timeout=3600)

# Retrieve later
conversation = cache.get(f"conversation_{thread_id}")
```

## 📊 Flow Diagram

```
┌─────────────────┐
│  User Message   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch Contacts  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Analyze Intent  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│ Ask  │  │ Compose  │
│ Qs   │  │ Emails   │
└──┬───┘  └─────┬────┘
   │            │
   │ (wait)     ▼
   │      ┌──────────┐
   │      │ Preview  │
   │      └─────┬────┘
   │            │
   │       (wait for
   │        approval)
   │            │
   └────────────┴──────▶ Send Emails
                            │
                            ▼
                        ┌────────┐
                        │ Done!  │
                        └────────┘
```

## 🎉 Benefits

✅ **User Control** - Review before sending
✅ **Fewer Mistakes** - Catch errors in preview
✅ **Better UX** - Conversational, not robotic
✅ **Complete Info** - Agent asks what it needs
✅ **Transparency** - See exactly what's being sent

## 📝 Next Steps

1. **Test the new flow** with various scenarios
2. **Customize the questions** for your use case
3. **Style the preview cards** to match your design
4. **Add edit functionality** (future enhancement)
5. **Save conversation history** (future enhancement)

## 🆘 Support

If you encounter issues:
1. Check all 3 servers are running
2. Check browser console for errors
3. Check Django terminal for backend errors
4. Check LangGraph terminal for agent errors
5. Verify thread_id is being passed correctly

---

**You're all set!** The conversational AI agent is ready to use. Try it out with: "Send that I'm on leave for 5 days to my manager and colleagues" 🚀
