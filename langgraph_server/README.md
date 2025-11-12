# LangGraph Email Agent Server

An AI-powered email agent that understands natural language commands and automatically sends emails to the right recipients with appropriate tones.

## Features

- 🤖 **Natural Language Processing**: Understands casual commands like "send that I'm on leave for 5 days to my manager and colleagues"
- 👥 **Smart Recipient Matching**: Automatically finds contacts based on their relation (manager, colleague, etc.)
- 🎭 **Tone Adaptation**: Adjusts email tone based on recipient's role and preferences
- 📧 **Multi-Recipient Support**: Sends personalized emails to multiple recipients simultaneously
- 🔗 **Seamless Integration**: Works with your existing Django backend and contact list

## Setup Instructions

### 1. Install Dependencies

```powershell
cd langgraph_server
pip install -r requirements.txt
```

### 2. Configure Google API Key

1. Get your Google API key from: https://aistudio.google.com/app/apikey
2. Open `.env` file and replace `your_google_api_key_here` with your actual API key:

```env
GOOGLE_API_KEY=your_actual_google_api_key
BACKEND_URL=http://127.0.0.1:8000
```

### 3. Start the Server

```powershell
python main.py
```

The server will start on `http://localhost:8001`

## Usage

### API Endpoint

**POST** `/agent/send-email`

Request body:
```json
{
  "message": "send that I'm on leave for 5 days to my manager and colleagues",
  "user_token": "your_jwt_token",
  "user_id": 1
}
```

Response:
```json
{
  "success": true,
  "emails_sent": 3,
  "results": "✓ Sent to John Manager (john@company.com)\n✓ Sent to Jane Colleague (jane@company.com)",
  "emails_details": [...]
}
```

### Example Commands

- "send that I'm on leave for 5 days to my manager and colleagues"
- "tell my manager that I'll be late tomorrow"
- "send meeting notes to all colleagues"
- "inform my manager about project completion"

## How It Works

1. **Fetch Contacts**: Retrieves your contact list from the backend
2. **Analyze Intent**: Uses Google's Gemini AI to understand your request and identify recipients
3. **Compose Emails**: Generates personalized emails with appropriate tone for each recipient
4. **Send Emails**: Sends emails through your Django backend's email API

## Architecture

```
User Input → LangGraph Agent → [Fetch Contacts] → [Analyze Intent] → [Compose Emails] → [Send Emails] → Result
```

## Integration with Frontend

Add this to your React component:

```jsx
const handleAgentSend = async () => {
  const token = localStorage.getItem('access_token');
  const response = await axios.post('http://127.0.0.1:8001/agent/send-email', {
    message: agentMessage,
    user_token: token,
    user_id: user.id
  });
  console.log(response.data);
};
```

## Troubleshooting

### Server won't start
- Check if port 8001 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Google API errors
- Ensure your API key is correctly set in `.env`
- Check API key has proper permissions
- Verify API key at https://aistudio.google.com/app/apikey

### Backend connection errors
- Make sure Django backend is running on port 8000
- Check BACKEND_URL in `.env` is correct
- Verify JWT token is valid

## API Documentation

Visit `http://localhost:8001/docs` when the server is running for interactive API documentation.

## Tech Stack

- **LangGraph**: Agent workflow orchestration
- **LangChain**: LLM integration
- **Google Gemini**: Natural language understanding
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server

## License

MIT License - see project root for details
