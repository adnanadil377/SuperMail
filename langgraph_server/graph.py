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
    model="gemini-2.0-flash-exp",
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

# Node Functions
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
    """Analyze user intent and extract email details"""
    print("🧠 Analyzing intent with AI...")
    contacts_info = "\n".join([
        f"- {c.get('name', 'Unknown')} ({c.get('email', 'N/A')}): relation={c.get('relation', 'N/A')}, tone={c.get('tone', 'professional')}"
        for c in state["contacts"]
    ])
    
    prompt = f"""Analyze this email request and extract structured information.

User Request: {state['user_input']}

Available Contacts:
{contacts_info}

Extract the following in JSON format:
{{
    "message_content": "the actual message to send",
    "recipients": [
        {{
            "name": "contact name",
            "email": "contact email",
            "relation": "their relation (manager/colleague/etc)",
            "tone": "tone to use for this person"
        }}
    ],
    "subject_hint": "suggested email subject"
}}

Rules:
1. Match recipients based on their relation (manager, colleague, etc.)
2. Use the tone specified for each contact
3. If multiple people match a relation, include all of them
4. Extract key information from the message (like "5 days leave")
5. Return ONLY valid JSON, no additional text
"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content
        # Extract JSON from response
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            intent = json.loads(json_str)
            state["intent"] = intent
            print(f"✓ Analyzed intent: {intent.get('subject_hint', 'No subject')}")
            print(f"  Recipients: {len(intent.get('recipients', []))} found")
        else:
            raise ValueError("No JSON found in response")
    except Exception as e:
        print(f"✗ Error analyzing intent: {e}")
        state["intent"] = {
            "recipients": [], 
            "message_content": state["user_input"],
            "subject_hint": "Email from AI Agent"
        }
    
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

def send_emails(state: EmailAgentState) -> EmailAgentState:
    """Send all composed emails"""
    print("📤 Sending emails...")
    results = []
    headers = {"Authorization": f"Bearer {state['user_token']}"}
    
    for email in state["emails_to_send"]:
        print(f"  Sending to {email['to_name']}...")
        try:
            response = requests.post(
                f"{BACKEND_URL}/gmailapi/send/",
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

# Build the graph
def create_graph():
    """Create and compile the LangGraph workflow"""
    workflow = StateGraph(EmailAgentState)
    
    # Add nodes
    workflow.add_node("fetch_contacts", fetch_contacts)
    workflow.add_node("analyze_intent", analyze_intent)
    workflow.add_node("compose_emails", compose_emails)
    workflow.add_node("send_emails", send_emails)
    
    # Define edges
    workflow.set_entry_point("fetch_contacts")
    workflow.add_edge("fetch_contacts", "analyze_intent")
    workflow.add_edge("analyze_intent", "compose_emails")
    workflow.add_edge("compose_emails", "send_emails")
    workflow.add_edge("send_emails", END)
    
    return workflow.compile()

# Export the graph for LangGraph Studio
graph = create_graph()
