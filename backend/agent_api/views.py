"""
Agent API Views
Connects Django backend to LangGraph server
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
import json
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

# LangGraph server URL (when running with langgraph dev)
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL", "http://127.0.0.1:2024")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_email_with_agent(request):
    """
    Send email using LangGraph AI agent with conversational flow
    
    Expected request body:
    {
        "message": "send that I'm on leave for 5 days to my manager and colleagues",
        "thread_id": "optional-conversation-id",  # For continuing conversations
        "action": "continue"  # or "send" to approve, or "cancel"
    }
    """
    try:
        user_message = request.data.get('message')
        thread_id = request.data.get('thread_id')
        action = request.data.get('action', 'continue')
        edited_emails = request.data.get('edited_emails')  # Get edited emails if provided
        
        if not user_message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user token from request
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        user_token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else ''
        
        # If user is sending with edited emails, send them directly
        if action == "send" and edited_emails:
            print(f"📧 Sending {len(edited_emails)} edited emails directly...")
            
            # Send each email using Gmail API
            results = []
            try:
                for email in edited_emails:
                    email_response = requests.post(
                        f"http://127.0.0.1:8000/gmailapi/send/",
                        json={
                            "to": email.get("to"),
                            "subject": email.get("subject"),
                            "body": email.get("body")
                        },
                        headers={"Authorization": f"Bearer {user_token}"},
                        timeout=30
                    )
                    email_response.raise_for_status()
                    results.append({
                        "to": email.get("to"),
                        "to_name": email.get("to_name"),
                        "status": "sent"
                    })
                    print(f"  ✓ Sent to {email.get('to_name')}")
                
                return Response({
                    "status": "complete",
                    "success": True,
                    "message": f"✅ Successfully sent {len(results)} email(s)",
                    "emails_sent": len(results),
                    "recipients": [r["to_name"] for r in results]
                })
            except Exception as e:
                print(f"❌ Error sending emails: {e}")
                return Response(
                    {"error": f"Failed to send emails: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Prepare input for LangGraph
        # Only send minimal required fields - let the graph maintain state
        langgraph_input = {
            "user_input": user_message,
            "user_token": user_token,
            "user_id": request.user.id
        }
        
        # If it's a "send" action, we're approving the emails
        if action == "send":
            langgraph_input["user_input"] = "send"
        
        # Call LangGraph API
        # For langgraph dev with inmem checkpointing
        # Each conversation needs a unique thread ID
        if thread_id:
            # Try to use provided thread_id if it's already a UUID
            try:
                thread_identifier = str(uuid.UUID(thread_id))
            except ValueError:
                # If not a UUID, create one from the string
                thread_identifier = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user_{thread_id}"))
        else:
            # Create a NEW unique UUID for each NEW conversation
            thread_identifier = str(uuid.uuid4())
        
        print(f"📡 Starting LangGraph request")
        print(f"📝 Input: {user_message} (action: {action}, thread: {thread_identifier})")
        
        # Step 1: Create or get thread
        thread_url = f"{LANGGRAPH_URL}/threads"
        thread_response = requests.post(
            thread_url,
            json={"thread_id": thread_identifier},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if thread_response.status_code in [200, 409]:  # 200 = created, 409 = already exists
            print(f"✓ Thread ready: {thread_identifier}")
        else:
            print(f"⚠️ Thread creation response: {thread_response.status_code}")
        
        # Step 2: Run the graph with the thread
        langgraph_endpoint = f"{LANGGRAPH_URL}/threads/{thread_identifier}/runs/wait"
        
        print(f"📡 Calling LangGraph at {langgraph_endpoint}")
        
        response = requests.post(
            langgraph_endpoint,
            json={
                "assistant_id": "email_agent",
                "input": langgraph_input
            },
            headers={
                "Content-Type": "application/json"
            },
            timeout=120
        )
        
        if response.status_code == 200:
            # Non-streaming response for simpler handling
            result = response.json()
            
            print(f"📦 Result keys: {list(result.keys())}")
            
            # The result should be the final state
            final_state = result
            
            print(f"🔍 Final state keys: {list(final_state.keys())}")
            print(f"🔍 Conversation complete: {final_state.get('conversation_complete')}")
            print(f"🔍 Awaiting approval: {final_state.get('awaiting_approval')}")
            print(f"🔍 Messages count: {len(final_state.get('messages', []))}")
            
            # Extract the last message from the agent
            messages = final_state.get('messages', [])
            agent_response = ""
            
            if messages:
                last_message = messages[-1]
                if isinstance(last_message, dict):
                    agent_response = last_message.get('content', '')
                    print(f"💬 Agent says: {agent_response[:100]}...")
                else:
                    agent_response = str(last_message)
                    print(f"💬 Agent says (raw): {agent_response[:100]}...")
            
            # Check if we're awaiting approval (preview shown)
            awaiting_approval = final_state.get('awaiting_approval', False)
            conversation_complete = final_state.get('conversation_complete', True)
            action_type = final_state.get('action_type', 'send_email')
            
            print(f"✅ Determined status - Complete: {conversation_complete}, Approval: {awaiting_approval}, Action: {action_type}")
            
            # Handle email summarization
            if action_type == "summarize_emails":
                print("📊 Returning email summary")
                return Response({
                    "status": "summary",
                    "message": agent_response,
                    "thread_id": thread_identifier,
                    "action_type": "summarize_emails"
                })
            
            # Determine response type for email sending
            if awaiting_approval:
                print("📧 Returning preview for approval")
                return Response({
                    "status": "awaiting_approval",
                    "message": agent_response,
                    "emails_preview": final_state.get('emails_to_send', []),
                    "thread_id": thread_identifier,
                    "needs_action": True,
                    "actions": ["send", "cancel", "edit"]
                })
            elif not conversation_complete:
                print("❓ Returning question for user")
                return Response({
                    "status": "needs_info",
                    "message": agent_response,
                    "thread_id": thread_identifier,
                    "needs_response": True
                })
            else:
                print("✅ Process complete or emails sent")
                # Emails sent or process complete
                emails_sent = len(final_state.get('emails_to_send', []))
                recipients = [
                    email.get('to_name', 'Unknown')
                    for email in final_state.get('emails_to_send', [])
                ]
                
                return Response({
                    "status": "complete",
                    "success": True,
                    "message": agent_response,
                    "emails_sent": emails_sent,
                    "recipients": recipients
                })
        else:
            return Response(
                {
                    "error": "LangGraph server error",
                    "details": response.text
                },
                status=status.HTTP_502_BAD_GATEWAY
            )
            
    except requests.exceptions.ConnectionError:
        return Response(
            {
                "error": "Cannot connect to LangGraph server",
                "help": "Make sure LangGraph server is running with 'langgraph dev'"
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except requests.exceptions.Timeout:
        return Response(
            {"error": "Request timeout - email processing took too long"},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agent_health(request):
    """
    Check if LangGraph agent is available
    """
    try:
        response = requests.get(f"{LANGGRAPH_URL}/ok", timeout=5)
        if response.status_code == 200:
            return Response({
                "status": "healthy",
                "langgraph_server": "connected",
                "url": LANGGRAPH_URL
            })
        else:
            return Response({
                "status": "unhealthy",
                "langgraph_server": "error",
                "details": response.text
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except requests.exceptions.ConnectionError:
        return Response({
            "status": "unhealthy",
            "langgraph_server": "disconnected",
            "help": "Start LangGraph server with 'langgraph dev' in langgraph_server directory"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        return Response({
            "status": "error",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
