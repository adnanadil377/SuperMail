"""
LangGraph Multi-Agent System
Features Triage, Researcher, Copywriter, and QA Agents.
"""

import os
from typing import TypedDict, Annotated, Sequence, Literal
from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
import requests
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field

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

# --- State Definition ---
class AgentState(TypedDict):
    """Global state for the multi-agent workflow"""
    messages: Annotated[list[BaseMessage], add_messages]
    user_input: str  # Kept for backwards compatibility
    user_token: str
    user_id: int
    
    # Agent Communication Fields
    action_type: str
    extracted_info: str
    draft_email: dict
    qa_feedback: str
    emails_to_send: list
    awaiting_approval: bool

# --- 1. Triage Agent ---
class TriageDecision(BaseModel):
    action: Literal["ask_user", "read_emails", "send_emails"]
    response_to_user: str = Field(description="Message to the user if asking for more info.")
    extracted_info: str = Field(description="Summary of the user's intent and any extracted details (names, dates, subjects).")

def triage_node(state: AgentState):
    print("[Triage Agent] Analyzing request...")
    sys_msg = """You are the Triage Agent. Your job is to chat with the user, figure out if they want to read or send emails, and gather missing info.
If they want to read emails, set action='read_emails'.
If they want to send an email, ensure you know WHO to send it to and WHAT the core message is. If this information is missing, set action='ask_user' and ask them in 'response_to_user'.
If all info is present for sending, set action='send_emails'."""
    
    response = llm.with_structured_output(TriageDecision).invoke([SystemMessage(content=sys_msg)] + state["messages"])
    
    if response.action == "ask_user":
        print(f"  -> Need more info: {response.response_to_user}")
        return {
            "action_type": "ask_user", 
            "messages": [AIMessage(content=response.response_to_user)], 
            "extracted_info": response.extracted_info
        }
    else:
        print(f"  -> Routing to: {response.action}")
        return {
            "action_type": response.action, 
            "extracted_info": response.extracted_info
        }

def triage_router(state: AgentState):
    if state.get("action_type") == "ask_user":
        return END
    elif state.get("action_type") in ["read_emails", "send_emails"]:
        return "researcher"
    return END

# --- 2. Researcher Agent ---
def researcher_node(state: AgentState):
    print("[Researcher Agent] Gathering data...")
    
    # Dynamically create tools so they have access to the current state (like user_token)
    @tool
    def get_latest_emails() -> str:
        """Fetch the user's latest emails from the inbox."""
        print("  -> Tool called: get_latest_emails")
        try:
            headers = {"Authorization": f"Bearer {state.get('user_token', '')}"}
            response = requests.get(f"{BACKEND_URL}/emails/", headers=headers)
            response.raise_for_status()
            data = response.json()
            return json.dumps(data.get("results", [])[:10])
        except Exception as e:
            return f"Error fetching emails: {e}"
            
    @tool
    def search_contacts() -> str:
        """Fetch the user's contacts to find email addresses."""
        print("  -> Tool called: search_contacts")
        try:
            headers = {"Authorization": f"Bearer {state.get('user_token', '')}"}
            response = requests.get(f"{BACKEND_URL}/contactapi/contacts/", headers=headers)
            response.raise_for_status()
            return json.dumps(response.json())
        except Exception as e:
            return f"Error fetching contacts: {e}"

    sys_msg = f"""You are the Researcher Agent. You have access to backend tools.
Current action: {state.get('action_type')}
Extracted info: {state.get('extracted_info', '')}

If action is 'read_emails': Use the get_latest_emails tool. Once you receive the data, write a beautifully formatted summary of the emails to the user and DO NOT call tools anymore.
If action is 'send_emails': Use the search_contacts tool to find the email address for the recipient mentioned in the extracted info. Once found, simply output 'CONTACT_FOUND: <email details>' and DO NOT call tools anymore.
"""
    bound_llm = llm.bind_tools([get_latest_emails, search_contacts])
    response = bound_llm.invoke([SystemMessage(content=sys_msg)] + state["messages"])
    return {"messages": [response]}

def researcher_tools_node(state: AgentState):
    print("[Researcher Tools] Executing tool...")
    last_msg = state["messages"][-1]
    
    # Re-define tools for execution
    def execute_get_latest_emails():
        try:
            headers = {"Authorization": f"Bearer {state.get('user_token', '')}"}
            response = requests.get(f"{BACKEND_URL}/emails/", headers=headers)
            response.raise_for_status()
            data = response.json()
            return json.dumps(data.get("results", [])[:10])
        except Exception as e:
            return f"Error fetching emails: {e}"
            
    def execute_search_contacts():
        try:
            headers = {"Authorization": f"Bearer {state.get('user_token', '')}"}
            response = requests.get(f"{BACKEND_URL}/contactapi/contacts/", headers=headers)
            response.raise_for_status()
            return json.dumps(response.json())
        except Exception as e:
            return f"Error fetching contacts: {e}"

    tool_map = {
        "get_latest_emails": execute_get_latest_emails, 
        "search_contacts": execute_search_contacts
    }
    
    tool_messages = []
    for tool_call in last_msg.tool_calls:
        tool_fn = tool_map.get(tool_call["name"])
        if tool_fn:
            result = tool_fn()
            tool_messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))
            
    return {"messages": tool_messages}

def researcher_router(state: AgentState):
    last_message = state["messages"][-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "researcher_tools"
    
    if state.get("action_type") == "read_emails":
        return END
    else:
        return "copywriter"

# --- 3. Copywriter Agent ---
class EmailDraft(BaseModel):
    subject: str
    body: str
    to_email: str
    to_name: str

def copywriter_node(state: AgentState):
    print("[Copywriter Agent] Drafting email...")
    sys_msg = f"""You are the Copywriter Agent.
Your job is to write an email draft based on the user's request.
Extracted info: {state.get('extracted_info', '')}
QA Feedback (if any): {state.get('qa_feedback', 'None')}

Review the conversation and the contact info found by the Researcher.
Write a professional email. 
CRITICAL: If QA Feedback is present, you MUST adjust your draft to fix the issues mentioned by the QA agent!"""
    
    response = llm.with_structured_output(EmailDraft).invoke([SystemMessage(content=sys_msg)] + state["messages"])
    
    draft = {
        "subject": response.subject,
        "body": response.body,
        "to": response.to_email,
        "to_name": response.to_name
    }
    print(f"  -> Drafted email to {draft['to_name']}")
    return {"draft_email": draft}

# --- 4. QA / Reviewer Agent ---
class QAResult(BaseModel):
    passed: bool = Field(description="True if the email is perfect, False if it needs rewriting.")
    feedback: str = Field(description="Detailed feedback if passed is False. Say 'Passed' if True.")

def qa_node(state: AgentState):
    print("[QA Agent] Reviewing draft...")
    draft = state.get("draft_email", {})
    sys_msg = f"""You are the QA / Reviewer Agent.
Your job is to review the following email draft:
To: {draft.get('to_name')} ({draft.get('to')})
Subject: {draft.get('subject')}

Body:
{draft.get('body')}

Criteria:
1. No typos or grammatical errors.
2. Professional tone appropriate for the workplace (especially if sending to a manager).
3. Accurately reflects the user's intent.

If it fails any of these, provide specific feedback on what needs to change. If it is perfect, set passed to True."""
    
    response = llm.with_structured_output(QAResult).invoke([SystemMessage(content=sys_msg)])
    
    if response.passed:
        print("  -> Status: PASSED")
        return {"qa_feedback": "Passed"}
    else:
        print(f"  -> Status: FAILED. Feedback: {response.feedback}")
        return {"qa_feedback": response.feedback}

def qa_router(state: AgentState):
    if state.get("qa_feedback") == "Passed":
        return "create_preview"
    else:
        return "copywriter"

# --- 5. Output / Action Nodes ---
def create_preview(state: AgentState):
    print("[System] Creating preview for user...")
    draft = state.get("draft_email", {})
    preview_text = f"**Email Preview**\n\n**To:** {draft.get('to_name')} ({draft.get('to')})\n**Subject:** {draft.get('subject')}\n**Body:**\n{draft.get('body')}\n\n---\n✅ Type **'send'** to send\n❌ Type **'cancel'** to cancel\n✏️ Type **'edit'** to make changes"
    
    emails_to_send = [draft]
    
    return {
        "messages": [AIMessage(content=preview_text)], 
        "awaiting_approval": True, 
        "emails_to_send": emails_to_send
    }

def send_emails_node(state: AgentState):
    print("[System] Sending emails...")
    results = []
    headers = {"Authorization": f"Bearer {state.get('user_token', '')}"}
    
    for email in state.get("emails_to_send", []):
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
            print(f"  -> Success: {email['to']}")
        except Exception as e:
            results.append(f"✗ Failed to send to {email.get('to_name')}: {e}")
            print(f"  -> Failed: {e}")
            
    return {"messages": [AIMessage(content="\n".join(results))], "awaiting_approval": False}

def cancel_node(state: AgentState):
    print("[System] Action cancelled by user.")
    return {"messages": [AIMessage(content="Email action cancelled.")], "awaiting_approval": False}

# --- Entry Router ---
def entry_router(state: AgentState):
    if state.get("awaiting_approval"):
        last_msg = state["messages"][-1].content.lower().strip()
        if last_msg in ["send", "yes", "approve", "confirm", "ok"]:
            return "send_emails"
        elif last_msg in ["cancel", "no", "stop"]:
            return "cancel_node"
        else:
            # Assume they want to edit the draft, pass back to Triage
            # We also set awaiting_approval to false so it processes normally
            return "triage"
    return "triage"

def prepare_edit_node(state: AgentState):
    # If editing, we reset approval state before hitting triage
    return {"awaiting_approval": False}

# --- Build the Graph ---
def create_graph():
    """Create and compile the Multi-Agent LangGraph workflow"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("triage", triage_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("researcher_tools", researcher_tools_node)
    workflow.add_node("copywriter", copywriter_node)
    workflow.add_node("qa", qa_node)
    workflow.add_node("create_preview", create_preview)
    workflow.add_node("send_emails", send_emails_node)
    workflow.add_node("cancel_node", cancel_node)
    workflow.add_node("prepare_edit", prepare_edit_node)
    
    # Entry Point & Routing
    workflow.add_conditional_edges(
        START,
        entry_router,
        {
            "triage": "triage",
            "send_emails": "send_emails",
            "cancel_node": "cancel_node"
        }
    )
    
    # Triage Agent Flow
    workflow.add_conditional_edges(
        "triage",
        triage_router,
        {
            "researcher": "researcher",
            END: END
        }
    )
    
    # Researcher Agent Flow
    workflow.add_conditional_edges(
        "researcher",
        researcher_router,
        {
            "researcher_tools": "researcher_tools",
            "copywriter": "copywriter",
            END: END
        }
    )
    workflow.add_edge("researcher_tools", "researcher")
    
    # Copywriter & QA Flow
    workflow.add_edge("copywriter", "qa")
    workflow.add_conditional_edges(
        "qa",
        qa_router,
        {
            "copywriter": "copywriter",
            "create_preview": "create_preview"
        }
    )
    
    # Output Nodes
    workflow.add_edge("create_preview", END)
    workflow.add_edge("send_emails", END)
    workflow.add_edge("cancel_node", END)
    
    return workflow.compile()

# Export the graph for LangGraph Studio
graph = create_graph()
