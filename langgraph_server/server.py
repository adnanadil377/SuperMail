"""
LangGraph Studio Server
This exposes the graph as an API for LangGraph Studio
"""

from graph import graph, EmailAgentState
from langchain_core.messages import HumanMessage

async def run_email_agent(user_input: str, user_token: str, user_id: int):
    """
    Run the email agent graph
    
    Args:
        user_input: Natural language email request
        user_token: JWT authentication token
        user_id: User ID
        
    Returns:
        dict with results
    """
    initial_state = {
        "messages": [HumanMessage(content=user_input)],
        "user_input": user_input,
        "contacts": [],
        "intent": {},
        "emails_to_send": [],
        "user_token": user_token,
        "user_id": user_id
    }
    
    result = graph.invoke(initial_state)
    
    return {
        "success": True,
        "emails_sent": len(result["emails_to_send"]),
        "results": result["messages"][-1].content if result["messages"] else "No emails sent",
        "emails_details": result["emails_to_send"]
    }

# For testing in LangGraph Studio
if __name__ == "__main__":
    import asyncio
    
    # Example test
    test_input = "Send that I'm on leave for 5 days to my manager"
    test_token = "your_test_token"
    test_user_id = 1
    
    result = asyncio.run(run_email_agent(test_input, test_token, test_user_id))
    print("\n" + "="*60)
    print("Test Result:")
    print("="*60)
    print(f"Success: {result['success']}")
    print(f"Emails sent: {result['emails_sent']}")
    print(f"Results:\n{result['results']}")
