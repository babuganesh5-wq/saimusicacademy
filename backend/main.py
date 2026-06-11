import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent
from vector_store import query_academy_db

app = FastAPI(
    title="Sai Music Academy Backend",
    description="FastAPI + LangChain + LangGraph + VectorDB Dynamic Agent Server",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessagePayload(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    text: str
    user_id: Optional[str] = "anonymous"
    chat_history: Optional[List[ChatMessagePayload]] = None
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = ""
    model: Optional[str] = ""

class ChatResponse(BaseModel):
    reply: str

class SyllabusSearchRequest(BaseModel):
    query: str

class SyllabusSearchResponse(BaseModel):
    context: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Endpoint to interact with the LangGraph chatbot agent."""
    try:
        # Map chat history format to the expected structure
        history = []
        if request.chat_history:
            history = [{"sender": msg.sender, "text": msg.text} for msg in request.chat_history]
            
        reply = run_agent(
            text=request.text,
            chat_history=history,
            provider=request.provider,
            api_key=request.api_key,
            model=request.model
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")

@app.post("/api/search-syllabus", response_model=SyllabusSearchResponse)
async def search_syllabus_endpoint(request: SyllabusSearchRequest):
    """Direct search endpoint for the vector database."""
    try:
        context = query_academy_db(request.query)
        return SyllabusSearchResponse(context=context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector Store Error: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "provider_options": ["gemini", "nvidia", "local"]}
