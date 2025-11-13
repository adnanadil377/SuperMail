# Integration Test Guide

## Quick Test Steps

### 1. Start All Services

```powershell
# From project root
.\start_all.ps1
```

Wait for all 3 servers to start:
- ✅ Django Backend on http://127.0.0.1:8000
- ✅ React Frontend on http://localhost:5173
- ✅ LangGraph Server on http://127.0.0.1:2024

### 2. Login to Your App

1. Open http://localhost:5173 in your browser
2. Login with your credentials
3. JWT token will be automatically saved to localStorage

### 3. Test the Health Check (Optional)

Open browser console (F12) and run:
```javascript
const token = localStorage.getItem('access_token');
fetch('http://localhost:8000/agent/health/', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Health:', d));
```

Expected output:
```json
{
  "status": "healthy",
  "langgraph_server": "connected",
  "url": "http://127.0.0.1:2024"
}
```

### 4. Test Sending Email via Agent

#### Option A: Use the UI Component

1. Navigate to the AI Email Agent page/component
2. Type: "Send that I'm on leave for 5 days to my manager and colleagues"
3. Click "Send via AI Agent"
4. Watch the process:
   - Loading spinner appears
   - AI processes your request
   - Success message shows recipients

#### Option B: Test via Browser Console

```javascript
const token = localStorage.getItem('access_token');
fetch('http://localhost:8000/agent/send/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "send that I'm on leave for 5 days to my manager"
  })
})
.then(r => r.json())
.then(d => console.log('Result:', d));
```

#### Option C: Test via PowerShell

```powershell
# Replace with your actual token
$token = "YOUR_JWT_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    message = "send that I'm on leave for 5 days to my manager and colleagues"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/agent/send/" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### 5. Verify Email Sending

Check the terminal windows for logs:

**LangGraph Terminal should show:**
```
📋 Fetching contacts from backend...
✓ Fetched 7 contacts
🧠 Analyzing intent with AI...
✓ Analyzed intent: Leave Notification
  Recipients: 2 found
✍️ Composing personalized emails...
  Composing for Manager...
    ✓ Composed email for Manager
  Composing for Colleague...
    ✓ Composed email for Colleague
✓ Composed 2 emails
📤 Sending emails...
  Sending to Manager...
    ✓ Email sent successfully
  Sending to Colleague...
    ✓ Email sent successfully
✓ Completed sending 2 emails
```

**Django Terminal should show:**
```
GET /contactapi/contacts/ 200
POST /gmailapi/send/ 200
POST /gmailapi/send/ 200
POST /agent/send/ 200
```

### 6. Expected Success Response

```json
{
  "success": true,
  "message": "✓ Sent to Manager Name (manager@example.com)\n✓ Sent to Colleague Name (colleague@example.com)",
  "emails_sent": 2,
  "recipients": ["Manager Name", "Colleague Name"]
}
```

## Common Test Scenarios

### Scenario 1: Simple Manager Email
**Input:** "Tell my manager I'll be late tomorrow"
**Expected:** 1 email to person with relation="manager"

### Scenario 2: Multiple Recipients
**Input:** "Send that I'm on leave for 5 days to my manager and colleagues"
**Expected:** Multiple emails (1 manager + N colleagues)

### Scenario 3: Specific Group
**Input:** "Send meeting notes to all colleagues"
**Expected:** Emails to all contacts with relation="colleague"

### Scenario 4: Custom Message
**Input:** "Inform my team about the project update"
**Expected:** Emails to team members (colleagues)

## Troubleshooting Tests

### Test Fails: Connection Error

**Check 1:** Is LangGraph running?
```powershell
curl http://127.0.0.1:2024/ok
```

**Check 2:** Is Django running?
```powershell
curl http://localhost:8000/admin/
```

**Check 3:** Check environment variables
```powershell
cd backend
Get-Content .env.local | Select-String "LANGGRAPH_URL"
# Should show: LANGGRAPH_URL=http://127.0.0.1:2024
```

### Test Fails: Authentication Error

**Check:** Token in localStorage
```javascript
console.log('Token:', localStorage.getItem('access_token'));
```

If null, login again.

### Test Fails: No Contacts Found

**Check:** Contacts exist in database
```powershell
cd backend
python manage.py shell
```
Then in Python shell:
```python
from contact_api.models import Contact
print(Contact.objects.all().count())
```

### Test Fails: Google API Rate Limit

**Error:** `429 Resource Exhausted`

**Solution:** Wait a few minutes or upgrade to paid tier

## Performance Tests

### Test 1: Response Time
Should complete in < 30 seconds for 2-3 recipients

### Test 2: Multiple Requests
Try sending multiple messages in sequence

### Test 3: Load Test
Send to 5+ contacts at once

## Debug Mode

Enable verbose logging:

**Django:**
In `backend/agent_api/views.py`, all logs are already enabled with `print()` statements

**LangGraph:**
In `langgraph_server/graph.py`, all nodes have `print()` logging

**Frontend:**
In browser console, all axios errors are logged

## Success Criteria

✅ Health check returns "healthy"
✅ Agent processes natural language correctly
✅ Emails are composed with proper tone
✅ All emails send successfully
✅ Success response shows all recipients
✅ No errors in any terminal

## Next Steps After Testing

1. Add more contacts with different relations
2. Try more complex messages
3. Test with actual Gmail accounts
4. Add approval workflow (future enhancement)
5. Add conversation history (future enhancement)
