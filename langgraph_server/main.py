"""
LangGraph Email Agent - FastAPI Wrapper for LangGraph Studio
This provides a REST API interface to the LangGraph graph
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
from server import run_email_agent

load_dotenv()

app = FastAPI(
    title="LangGraph Email Agent",
    description="AI-powered email agent that understands natural language commands",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8123"  # LangGraph Studio
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailRequest(BaseModel):
    message: str
    user_token: str
    user_id: int

class HealthResponse(BaseModel):
    status: str
    mode: str
    google_api_configured: bool

@app.post("/agent/send-email")
async def send_email_via_agent(request: EmailRequest):
    """
    Process natural language email request
    
    Example requests:
    - "send that I'm on leave for 5 days to my manager and colleagues"
    - "tell my manager that I'll be late tomorrow"
    - "send meeting notes to all colleagues"
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if not request.user_token:
            raise HTTPException(status_code=401, detail="User token is required")
        
        result = await run_email_agent(
            user_input=request.message,
            user_token=request.user_token,
            user_id=request.user_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the server is running and properly configured"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    return {
        "status": "healthy",
        "mode": "langgraph-studio",
        "google_api_configured": bool(google_api_key and google_api_key != "your_google_api_key_here")
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LangGraph Email Agent API (Studio Mode)",
        "version": "2.0.0",
        "mode": "langgraph-studio",
        "endpoints": {
            "send_email": "/agent/send-email",
            "health": "/health",
            "docs": "/docs"
        },
        "studio": {
            "start": "langgraph dev",
            "port": 8123
        }
    }

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting LangGraph Email Agent Server")
    print("=" * 60)
    print(f"📍 Mode: LangGraph Studio Compatible")
    print(f"📍 API Documentation: http://localhost:8001/docs")
    print(f"📍 Health Check: http://localhost:8001/health")
    print(f"📍 Agent Endpoint: http://localhost:8001/agent/send-email")
    print("")
    print("💡 For LangGraph Studio visualization:")
    print(f"   Run: langgraph dev")
    print(f"   Then visit: http://localhost:8123")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
