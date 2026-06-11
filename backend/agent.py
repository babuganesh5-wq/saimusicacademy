import os
from typing import TypedDict, List, Annotated
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langgraph.graph import StateGraph, START, END
from vector_store import query_academy_db

# Define graph state
class AgentState(TypedDict):
    messages: List[BaseMessage]
    context: str
    reply: str
    provider: str
    api_key: str
    model: str

SYSTEM_PROMPT = """You are Sai, the warm and knowledgeable virtual music guide for Sai Music Academy — a premier online Indian Classical music education platform. 
You have expertise in all 22 disciplines offered: Carnatic Vocal, Hindustani Vocal, Western Vocal, Mridangam, Tabla, Ghatam, Kanjira, Konnakol, Cajon, Morsing, Veena, Violin, Flute, Keyboard, Guitar, Sitar, Mandolin, Saxophone, Harmonium, Recorder, Bharatanatyam, and Yoga.
Use the following context from our academy's database to answer the user's question. If the context doesn't contain the answer, answer warm and professionally using your general knowledge about music.
Response style: Warm, professional, informative. Keep replies concise (2-4 sentences max). Use relevant emojis sparingly for warmth.

Context:
{context}"""

def retrieve_node(state: AgentState) -> dict:
    """Retrieve node to query local Vector DB."""
    last_message = state["messages"][-1].content
    context = query_academy_db(last_message)
    return {"context": context}

def respond_node(state: AgentState) -> dict:
    """Respond node to invoke LLM with system prompt + context."""
    provider = state.get("provider", "gemini")
    api_key = state.get("api_key", "")
    model_name = state.get("model", "")
    
    # Initialize the LLM dynamically based on user preferences
    llm = None
    if provider == "gemini" and api_key:
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash", 
                google_api_key=api_key,
                temperature=0.7
            )
        except Exception as e:
            print(f"Error loading Gemini model: {e}")
            
    elif provider == "nvidia" and api_key:
        try:
            # Fallback model if not specified
            model = model_name or "meta/llama-3.1-70b-instruct"
            llm = ChatNVIDIA(
                model=model,
                nvidia_api_key=api_key,
                temperature=0.7
            )
        except Exception as e:
            print(f"Error loading NVIDIA model: {e}")

    # Format prompt
    formatted_system = SYSTEM_PROMPT.format(context=state.get("context", ""))
    
    messages = [SystemMessage(content=formatted_system)] + state["messages"]
    
    if llm:
        try:
            response = llm.invoke(messages)
            reply = response.content
        except Exception as e:
            reply = f"⚠️ Local Agent LLM error: {e}. Here is local context: {state['context']}"
    else:
        # Fallback offline mode if no API key is passed
        reply = f"🎵 (Offline Agent Mode) Here is what I found in our database: {state['context']}"
        
    return {"reply": reply}

# Build LangGraph workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("respond", respond_node)

# Add edges
workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "respond")
workflow.add_edge("respond", END)

# Compile graph
agent_app = workflow.compile()

def run_agent(text: str, chat_history: List[dict] = None, provider: str = "gemini", api_key: str = "", model: str = "") -> str:
    """Run the LangGraph chatbot agent."""
    messages = []
    if chat_history:
        for msg in chat_history:
            if msg.get("sender") == "user":
                messages.append(HumanMessage(content=msg.get("text", "")))
            elif msg.get("sender") == "bot":
                messages.append(AIMessage(content=msg.get("text", "")))
                
    messages.append(HumanMessage(content=text))
    
    initial_state = {
        "messages": messages,
        "context": "",
        "reply": "",
        "provider": provider,
        "api_key": api_key,
        "model": model
    }
    
    final_state = agent_app.invoke(initial_state)
    return final_state["reply"]
