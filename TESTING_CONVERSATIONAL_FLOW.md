# Testing the Conversational Flow - Debug Guide

## Expected Flow

### Test 1: Initial Request with Missing Info

**Step 1:** User sends message
```
"Send that I'm on leave for 5 days to my manager and colleagues"
```

**What should happen in Django terminal:**
```
📡 Calling LangGraph at http://127.0.0.1:2024/threads/user_1/runs/stream
📝 Input: Send that I'm on leave for 5 days to my manager and colleagues (action: continue, thread: user_1)
```

**What should happen in LangGraph terminal:**
```
📋 Fetching contacts from backend...
✓ Fetched X contacts
🧠 Analyzing intent with AI...
✓ Analyzed intent: Leave Notification
  Recipients: 3 found
  Missing info: 1 critical items
🔍 Checking for missing information...
  ❓ Asking user: What are the specific start and end dates for your 5-day leave?
```

**What should happen in Django terminal:**
```
📦 State update: ['messages', 'user_input', 'contacts', 'intent', 'missing_info', 'conversation_complete', ...]
🔍 Final state keys: [...]
🔍 Conversation complete: False
🔍 Awaiting approval: False
🔍 Messages count: 1
💬 Agent says: What are the specific start and end dates for your 5-day leave?
✅ Determined status - Complete: False, Approval: False
❓ Returning question for user
```

**What should happen in Browser Console:**
```javascript
📦 Agent response: {status: "needs_info", message: "What are the specific start and end dates...", thread_id: "user_1"}
❓ Agent needs more info
```

**What should happen in Frontend UI:**
- Conversation history shows:
  - 👤 You: "Send that I'm on leave for 5 days to my manager and colleagues"
  - 🤖 Agent: "What are the specific start and end dates for your 5-day leave?"
- Input box is empty and ready for user response
- No approval buttons visible

---

### Test 2: User Provides Answer

**Step 2:** User answers the question
```
"From December 15th to December 20th"
```

**What should happen in Django terminal:**
```
📡 Calling LangGraph at http://127.0.0.1:2024/threads/user_1/runs/stream
📝 Input: From December 15th to December 20th (action: continue, thread: user_1)
```

**What should happen in LangGraph terminal:**
```
📋 Fetching contacts from backend...
✓ Fetched X contacts
🧠 Analyzing intent with AI...
✓ Analyzed intent: Leave Notification - [Your Name]
  Recipients: 3 found
  Missing info: 0 critical items
🔍 Checking for missing information...
  ✓ All information collected
✍️ Composing personalized emails...
  Composing for Manager...
    ✓ Composed email for Manager
  Composing for Colleague1...
    ✓ Composed email for Colleague1
  Composing for Colleague2...
    ✓ Composed email for Colleague2
✓ Composed 3 emails
👀 Creating email preview...
  ✓ Preview created for 3 emails
```

**What should happen in Django terminal:**
```
📦 State update: [...]
🔍 Final state keys: [...]
🔍 Conversation complete: True
🔍 Awaiting approval: True
🔍 Messages count: 3
💬 Agent says: 📧 **Email Preview** - Review before sending...
✅ Determined status - Complete: True, Approval: True
📧 Returning preview for approval
```

**What should happen in Browser Console:**
```javascript
📦 Agent response: {status: "awaiting_approval", message: "📧 Email Preview...", thread_id: "user_1", emails_preview: [{...}, {...}, {...}]}
📧 Showing email preview
```

**What should happen in Frontend UI:**
- Conversation history shows both previous messages
- Email preview section appears with 3 email cards showing:
  - To, Subject, Body for each email
- Two buttons appear:
  - ✅ "Send All Emails" (green)
  - ❌ "Cancel" (red)
- Input box is hidden

---

### Test 3: User Approves

**Step 3:** User clicks "Send All Emails"

**What should happen in Django terminal:**
```
📡 Calling LangGraph at http://127.0.0.1:2024/threads/user_1/runs/stream
📝 Input: send (action: send, thread: user_1)
```

**What should happen in LangGraph terminal:**
```
📤 Sending emails...
  Sending to Manager...
    ✓ Email sent successfully
  Sending to Colleague1...
    ✓ Email sent successfully
  Sending to Colleague2...
    ✓ Email sent successfully
✓ Completed sending 3 emails
```

**What should happen in Browser Console:**
```javascript
📦 Agent response: {status: "complete", success: true, emails_sent: 3, recipients: ["Manager", "Colleague1", "Colleague2"]}
✅ Process complete
```

**What should happen in Frontend UI:**
- Green success message appears: "✅ Successfully sent 3 email(s) to: Manager, Colleague1, Colleague2"
- After 5 seconds, everything resets

---

## Troubleshooting

### Issue: Agent question doesn't show in frontend

**Check 1:** Django terminal shows `conversation_complete: False`
```bash
# Should see:
🔍 Conversation complete: False
❓ Returning question for user
```

**Check 2:** Browser console shows `needs_info` status
```javascript
// Should see:
📦 Agent response: {status: "needs_info", ...}
❓ Agent needs more info
```

**Check 3:** Agent response has a message
```javascript
// Should have content:
message: "What are the specific start and end dates..."
```

**Fix:** If any of these are wrong, check:
1. LangGraph `check_missing_info()` is being called
2. `conversation_complete` is being set to `False`
3. Django is reading the state correctly

---

### Issue: Conversation doesn't continue

**Problem:** User answers but graph restarts from beginning

**Check:** Thread ID is being passed
```bash
# Django terminal should show same thread ID for both requests:
📝 Input: ... (action: continue, thread: user_1)
📝 Input: ... (action: continue, thread: user_1)  # Same!
```

**Fix:** Make sure `thread_id` from first response is saved and sent with second request

---

### Issue: Preview doesn't show

**Check 1:** Django shows `awaiting_approval: True`
```bash
🔍 Awaiting approval: True
📧 Returning preview for approval
```

**Check 2:** `emails_preview` array has data
```bash
# Should have emails:
emails_preview: [{to: "...", subject: "...", body: "..."}, ...]
```

**Check 3:** Frontend receives status
```javascript
// Should see:
status: "awaiting_approval"
```

---

## Manual API Testing

### Test with curl (PowerShell):

```powershell
# Step 1: Initial request
$token = "YOUR_JWT_TOKEN"
$body = @{
    message = "Send that I'm on leave for 5 days to my manager"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/agent/send/" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body

# Should return: {status: "needs_info", message: "What are...", thread_id: "user_X"}

# Step 2: Answer question (use thread_id from step 1)
$body2 = @{
    message = "From December 15th to 20th"
    thread_id = "user_1"  # Use the thread_id from step 1!
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/agent/send/" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body2

# Should return: {status: "awaiting_approval", emails_preview: [...]}

# Step 3: Approve (use same thread_id)
$body3 = @{
    message = "send"
    thread_id = "user_1"
    action = "send"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/agent/send/" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body3

# Should return: {status: "complete", success: true, emails_sent: X}
```

---

## What to Watch

### Django Terminal (http://127.0.0.1:8000)
```
📡 Calling LangGraph...
📦 State update: [...]
🔍 Final state keys: [...]
🔍 Conversation complete: False/True
🔍 Awaiting approval: False/True
💬 Agent says: ...
✅ Determined status - Complete: X, Approval: Y
❓ Returning question for user
   OR
📧 Returning preview for approval
   OR
✅ Process complete
```

### LangGraph Terminal (http://127.0.0.1:2024)
```
📋 Fetching contacts...
🧠 Analyzing intent...
✓ Analyzed intent...
  Recipients: X found
  Missing info: Y critical items
🔍 Checking for missing information...
  ❓ Asking user: ...
   OR
  ✓ All information collected
✍️ Composing...
👀 Creating email preview...
📤 Sending emails...
```

### Browser Console (F12)
```javascript
📦 Agent response: {status: "...", message: "..."}
❓ Agent needs more info
   OR
📧 Showing email preview
   OR
✅ Process complete
```

### Frontend UI
1. Conversation history updates
2. Agent question appears
3. User can type answer
4. Preview shows when ready
5. Approval buttons work

---

## Success Criteria

✅ User sees agent's question in the conversation
✅ Thread ID persists across requests
✅ Answer triggers new processing
✅ Preview shows all emails
✅ Approval buttons work
✅ Emails actually send

If all these work, you have a fully functional conversational AI agent! 🎉
