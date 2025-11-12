import os

from langchain.agents import create_agent
os.environ["GOOGLE_API_KEY"] = "AIzaSyA2GTu07HU7dc2rs0u1pBqbf1s54wjBpvo"
def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"

agent = create_agent(
    model="google_genai:gemini-2.5-flash-lite",
    tools=[get_weather],
    system_prompt="You are a helpful assistant",
)

# Run the agent
response = agent.invoke(
    {"messages": [{"role": "user", "content": "what is the weather in sf"}]}
)
print(response)