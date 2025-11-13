"""
LangGraph Email Agent Graph
This is the main graph file for LangGraph Studio
"""

import os
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-latest",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)

# Define State
class EmailAgentState(TypedDict):
    """State for the email agent workflow"""
    messages: Annotated[Sequence[BaseMessage], "The messages in the conversation"]
    user_input: str
    contacts: list
    intent: dict
    emails_to_send: list
    user_token: str
    user_id: int
    missing_info: list  # List of missing information that needs to be asked
    conversation_complete: bool  # Whether we have all info needed
    awaiting_approval: bool  # Whether we're waiting for user to approve sending
    action_type: str  # Type of action: 'send_email', 'summarize_emails', or 'unknown'
    fetched_emails: list  # List of fetched emails for summarization

# Node Functions
def detect_action_type(state: EmailAgentState) -> EmailAgentState:
    """Detect what type of action the user wants to perform"""
    print("🔍 Detecting action type...")
    
    user_input = state["user_input"].lower()
    
    # Keywords for summarization
    summarize_keywords = ['summarize', 'summary', 'recent emails', 'latest emails', 
                          'what emails', 'show emails', 'my emails', 'inbox summary',
                          'email overview', 'what did i receive', 'check my emails']
    
    # Check if user wants summarization
    if any(keyword in user_input for keyword in summarize_keywords):
        state["action_type"] = "summarize_emails"
        state["conversation_complete"] = True
        print("  ✓ Detected: Email Summarization")
    else:
        # Default to sending emails
        state["action_type"] = "send_email"
        print("  ✓ Detected: Send Email")
    
    return state

def fetch_emails(state: EmailAgentState) -> EmailAgentState:
    """Fetch recent emails from the backend"""
    print("📬 Fetching recent emails...")
    try:
        headers = {"Authorization": f"Bearer {state['user_token']}"}
        response = requests.get(
            f"{BACKEND_URL}/emails/",  # Fetch last 10 emails
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        
        # FIX: Change from "emails" to "results" to match your API response
        state["fetched_emails"] = data.get("results", [])
        print(f"✓ Fetched {len(state['fetched_emails'])} emails")
        
        # Optional: Log the total count and next page token
        total_count = data.get("total_count", 0)
        print(f"  Total emails available: {total_count}")
        
    except Exception as e:
        print(f"✗ Error fetching emails: {e}")
        state["fetched_emails"] = []
    return state

def summarize_emails(state: EmailAgentState) -> EmailAgentState:
    """Summarize the fetched emails using AI"""
    print("📝 Summarizing emails with AI...")
    
    emails = state["fetched_emails"]
    
    if not emails:
        summary = "📭 No recent emails found in your inbox."
        if "messages" not in state or state["messages"] is None:
            state["messages"] = []
        state["messages"] = list(state["messages"]) + [AIMessage(content=summary)]
        return state
    
    # Prepare email data for summarization
    emails_text = ""
    for idx, email in enumerate(emails[:10], 1):  # Limit to 10 emails
        from_email = email.get("from", "Unknown")
        subject = email.get("subject", "No Subject")
        snippet = email.get("snippet", "")
        date = email.get("date", "Unknown date")
        
        emails_text += f"{idx}. From: {from_email}\n"
        emails_text += f"   Subject: {subject}\n"
        emails_text += f"   Date: {date}\n"
        emails_text += f"   Preview: {snippet[:150]}...\n\n"
    
    prompt = f"""You are an AI email assistant. Summarize these recent emails in a clear, organized way.

RECENT EMAILS:
{emails_text}

Provide a summary that includes:
1. Total number of emails
2. Key highlights (important emails, urgent matters)
3. Breakdown by sender/topic if relevant
4. Any action items or follow-ups needed

Format your response in a friendly, easy-to-read way with emojis where appropriate.
Keep it concise but informative."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        summary = response.content
        print(f"✓ Generated summary: {len(summary)} characters")
    except Exception as e:
        print(f"✗ Error generating summary: {e}")
        summary = f"📬 You have {len(emails)} recent emails. I encountered an error summarizing them, but here's a quick overview:\n\n"
        for idx, email in enumerate(emails[:5], 1):
            summary += f"{idx}. **{email.get('subject', 'No Subject')}** from {email.get('from', 'Unknown')}\n"
    
    # Add summary to messages
    if "messages" not in state or state["messages"] is None:
        state["messages"] = []
    
    state["messages"] = list(state["messages"]) + [AIMessage(content=summary)]
    print("✓ Email summary added to conversation")
    
    return state

def fetch_contacts(state: EmailAgentState) -> EmailAgentState:
    """Fetch contacts from the backend"""
    print("📋 Fetching contacts from backend...")
    try:
        headers = {"Authorization": f"Bearer {state['user_token']}"}
        response = requests.get(f"{BACKEND_URL}/contactapi/contacts/", headers=headers)
        response.raise_for_status()
        state["contacts"] = response.json()
        print(f"✓ Fetched {len(state['contacts'])} contacts")
    except Exception as e:
        print(f"✗ Error fetching contacts: {e}")
        state["contacts"] = []
    return state

def analyze_intent(state: EmailAgentState) -> EmailAgentState:
    """Analyze user intent and identify missing information"""
    print("🧠 Analyzing intent with AI...")
    contacts_info = "\n".join([
        f"- {c.get('name', 'Unknown')} ({c.get('email', 'N/A')}): relation={c.get('relation', 'N/A')}, tone={c.get('tone', 'professional')}"
        for c in state["contacts"]
    ])
    
    # Get full conversation history INCLUDING the latest user input
    conversation_history = ""
    if state.get("messages"):
        for msg in state["messages"]:
            if isinstance(msg, HumanMessage):
                conversation_history += f"User: {msg.content}\n"
            elif isinstance(msg, AIMessage):
                conversation_history += f"Assistant: {msg.content}\n"
    
    # Add current user input to the analysis
    conversation_history += f"User: {state['user_input']}\n"
    
    prompt = f"""You are analyzing an email request conversation. Your job is to extract ALL information provided across the ENTIRE conversation and identify what is still missing.

FULL CONVERSATION HISTORY:
{conversation_history}

Available Contacts:
{contacts_info}

CRITICAL INSTRUCTIONS:
1. CAREFULLY read the ENTIRE conversation from start to finish
2. Extract ALL dates, durations, reasons, and details mentioned in ANY message
3. If a user provides information (like "14th november to 18th november"), that information is NOW PROVIDED - do NOT ask for it again
4. Only mark information as "missing" if it was NEVER mentioned anywhere in the conversation
5. If user mentions a duration like "5 days", calculate or use that for the date range

Return JSON with:
{{
    "message_content": "Complete message combining ALL information from the conversation",
    "recipients": [
        {{
            "name": "contact name",
            "email": "contact email", 
            "relation": "their relation",
            "tone": "tone to use"
        }}
    ],
    "subject_hint": "suggested subject",
    "missing_info": [
        {{
            "field": "field name ONLY if truly missing",
            "question": "Natural question to ask user",
            "importance": "critical or optional"
        }}
    ],
    "extracted_info": {{
        "start_date": "extracted date or null",
        "end_date": "extracted date or null",
        "duration": "extracted duration or null",
        "reason": "extracted reason or null",
        "all_info_provided": true or false
    }}
}}

EXAMPLES:
- If user said "14th november to 18th november" → start_date="14th November", end_date="18th November", missing_info=[]
- If user said "5 days starting tomorrow" → extract both dates, missing_info=[]
- Only add to missing_info if the information was NEVER mentioned

Return ONLY valid JSON, no additional text."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            intent = json.loads(json_str)
            state["intent"] = intent
            
            # Check if all info is provided based on extracted_info
            extracted = intent.get("extracted_info", {})
            all_info_provided = extracted.get("all_info_provided", False)
            
            # Get missing info and filter to only critical items
            missing_info = intent.get("missing_info", [])
            critical_missing = [m for m in missing_info if m.get("importance") == "critical"]
            
            state["missing_info"] = critical_missing
            
            # Mark conversation complete if no critical missing info
            state["conversation_complete"] = len(critical_missing) == 0 or all_info_provided
            
            print(f"✓ Analyzed intent: {intent.get('subject_hint', 'No subject')}")
            print(f"  Recipients: {len(intent.get('recipients', []))} found")
            print(f"  Extracted info: {extracted}")
            print(f"  Missing info: {len(critical_missing)} critical items")
            
            if state["conversation_complete"]:
                print(f"  ✅ All information collected! Message: {intent.get('message_content', '')[:100]}...")
            else:
                print(f"  ❓ Still need: {[m['field'] for m in critical_missing]}")
        else:
            raise ValueError("No JSON found in response")
    except Exception as e:
        print(f"✗ Error analyzing intent: {e}")
        print(f"  Response content: {response.content if 'response' in locals() else 'No response'}")
        state["intent"] = {
            "recipients": [], 
            "message_content": state["user_input"],
            "subject_hint": "Email from AI Agent",
            "missing_info": []
        }
        state["missing_info"] = []
        state["conversation_complete"] = True
    
    return state

def compose_emails(state: EmailAgentState) -> EmailAgentState:
    """Compose personalized emails for each recipient"""
    print("✍️ Composing personalized emails...")
    emails = []
    intent = state["intent"]
    
    for recipient in intent.get("recipients", []):
        print(f"  Composing for {recipient.get('name', 'Unknown')}...")
        prompt = f"""Compose a professional email based on this information:

Message Content: {intent.get('message_content', '')}
Recipient: {recipient.get('name', 'Unknown')}
Recipient Relation: {recipient.get('relation', 'colleague')}
Tone to Use: {recipient.get('tone', 'professional')}
Subject Hint: {intent.get('subject_hint', '')}

Generate a JSON response with:
{{
    "subject": "email subject line",
    "body": "email body with proper formatting, newlines, and professional structure"
}}

Important:
- Adapt the tone based on the recipient's relation and specified tone
- For managers: more formal and professional
- For colleagues: can be slightly more casual but still professional
- Include proper salutation and closing
- Use \\n for line breaks in the body
- Return ONLY valid JSON, no additional text
"""
        
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            content = response.content
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end > start:
                json_str = content[start:end]
                email_data = json.loads(json_str)
                
                emails.append({
                    "to": recipient.get("email"),
                    "to_name": recipient.get("name"),
                    "subject": email_data.get("subject", intent.get('subject_hint', 'Email')),
                    "body": email_data.get("body", intent.get('message_content', '')),
                    "tone": recipient.get("tone", "professional")
                })
                print(f"    ✓ Composed email for {recipient.get('name')}")
            else:
                raise ValueError("No JSON found in response")
        except Exception as e:
            print(f"    ✗ Error composing email for {recipient.get('name')}: {e}")
            # Fallback email
            emails.append({
                "to": recipient.get("email"),
                "to_name": recipient.get("name"),
                "subject": intent.get('subject_hint', 'Email'),
                "body": intent.get('message_content', ''),
                "tone": recipient.get("tone", "professional")
            })
    
    state["emails_to_send"] = emails
    print(f"✓ Composed {len(emails)} emails")
    return state

def check_missing_info(state: EmailAgentState) -> EmailAgentState:
    """Check if we need to ask for more information"""
    print("🔍 Checking for missing information...")
    
    # Get all messages to check if we already asked this question
    existing_questions = []
    if state.get("messages"):
        for msg in state["messages"]:
            if isinstance(msg, AIMessage):
                existing_questions.append(msg.content.lower())
    
    critical_missing = [m for m in state.get("missing_info", []) 
                       if m.get("importance") == "critical"]
    
    if critical_missing and not state.get("conversation_complete", False):
        # Get the question for the first missing item
        question = critical_missing[0].get("question", "Could you provide more details?")
        
        # Check if we already asked a similar question
        question_lower = question.lower()
        already_asked = any(
            q in question_lower or question_lower in q 
            for q in existing_questions
        )
        
        if already_asked:
            # We already asked this, mark as complete to avoid loop
            print(f"  ⚠️ Already asked this question, moving forward...")
            state["conversation_complete"] = True
        else:
            if "messages" not in state or state["messages"] is None:
                state["messages"] = []
            
            state["messages"] = list(state["messages"]) + [AIMessage(content=question)]
            state["conversation_complete"] = False
            print(f"  ❓ Asking user: {question}")
    else:
        state["conversation_complete"] = True
        print("  ✓ All information collected")
    
    return state

def create_preview(state: EmailAgentState) -> EmailAgentState:
    """Create preview of emails for user approval"""
    print("👀 Creating email preview...")
    
    preview_text = "📧 **Email Preview** - Review before sending:\n\n"
    
    for idx, email in enumerate(state["emails_to_send"], 1):
        preview_text += f"--- Email {idx} ---\n"
        preview_text += f"**To:** {email['to_name']} ({email['to']})\n"
        preview_text += f"**Subject:** {email['subject']}\n"
        preview_text += f"**Body:**\n{email['body']}\n\n"
    
    preview_text += "---\n\n"
    preview_text += "✅ Type **'send'** to send these emails\n"
    preview_text += "❌ Type **'cancel'** to cancel\n"
    preview_text += "✏️ Type **'edit'** to make changes"
    
    if "messages" not in state or state["messages"] is None:
        state["messages"] = []
    
    state["messages"] = list(state["messages"]) + [AIMessage(content=preview_text)]
    state["awaiting_approval"] = True
    
    print(f"  ✓ Preview created for {len(state['emails_to_send'])} emails")
    return state

def send_emails(state: EmailAgentState) -> EmailAgentState:
    """Send all composed emails"""
    print("📤 Sending emails...")
    results = []
    headers = {"Authorization": f"Bearer {state['user_token']}"}
    
    for email in state["emails_to_send"]:
        print(f"  Sending to {email['to_name']}...")
        try:
            response = requests.post(
                f"{BACKEND_URL}/send/",
                json={
                    "to": email["to"],
                    "subject": email["subject"],
                    "body": email["body"]
                },
                headers=headers
            )
            response.raise_for_status()
            results.append(f"✓ Sent to {email['to_name']} ({email['to']})")
            print(f"    ✓ Email sent successfully")
        except Exception as e:
            results.append(f"✗ Failed to send to {email['to_name']}: {str(e)}")
            print(f"    ✗ Error: {e}")
    
    # Safely append to messages
    if "messages" not in state or state["messages"] is None:
        state["messages"] = []
    
    state["messages"] = list(state["messages"]) + [AIMessage(content="\n".join(results))]
    print(f"✓ Completed sending {len(results)} emails")
    return state

# Routing functions
def route_by_action(state: EmailAgentState) -> str:
    """Route to different workflows based on action type"""
    action_type = state.get("action_type", "send_email")
    
    if action_type == "summarize_emails":
        return "summarize"
    else:
        return "send_email"

def should_ask_questions(state: EmailAgentState) -> str:
    """Decide if we need to ask for more info or proceed to compose"""
    if not state.get("conversation_complete", False):
        return "ask_questions"
    return "compose"

def should_send_or_wait(state: EmailAgentState) -> str:
    """Decide if we should send emails or wait for approval"""
    user_input = state.get("user_input", "").lower().strip()
    
    # Check if user approved
    if user_input in ["send", "yes", "approve", "confirm", "ok"]:
        return "send"
    elif user_input in ["cancel", "no", "stop"]:
        return "cancel"
    else:
        return "preview"

# Build the graph
def create_graph():
    """Create and compile the LangGraph workflow with human-in-the-loop"""
    workflow = StateGraph(EmailAgentState)
    
    # Add nodes
    workflow.add_node("detect_action_type", detect_action_type)
    workflow.add_node("fetch_contacts", fetch_contacts)
    workflow.add_node("analyze_intent", analyze_intent)
    workflow.add_node("check_missing_info", check_missing_info)
    workflow.add_node("compose_emails", compose_emails)
    workflow.add_node("create_preview", create_preview)
    workflow.add_node("send_emails", send_emails)
    workflow.add_node("fetch_emails", fetch_emails)
    workflow.add_node("summarize_emails", summarize_emails)
    
    # Define edges - Start with action detection
    workflow.set_entry_point("detect_action_type")
    
    # Route based on action type
    workflow.add_conditional_edges(
        "detect_action_type",
        route_by_action,
        {
            "summarize": "fetch_emails",
            "send_email": "fetch_contacts"
        }
    )
    
    # Email summarization flow
    workflow.add_edge("fetch_emails", "summarize_emails")
    workflow.add_edge("summarize_emails", END)
    
    # Email sending flow (existing)
    workflow.add_edge("fetch_contacts", "analyze_intent")
    
    # Conditional: ask questions or compose?
    workflow.add_conditional_edges(
        "analyze_intent",
        should_ask_questions,
        {
            "ask_questions": "check_missing_info",
            "compose": "compose_emails"
        }
    )
    
    # If asking questions, wait for user input (return to END)
    workflow.add_edge("check_missing_info", END)
    
    # After composing, show preview
    workflow.add_edge("compose_emails", "create_preview")
    
    # Preview waits for approval (return to END)
    workflow.add_edge("create_preview", END)
    
    # When user approves, send emails
    workflow.add_edge("send_emails", END)
    
    return workflow.compile()

# Export the graph for LangGraph Studio
graph = create_graph()
