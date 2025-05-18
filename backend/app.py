from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from processor import process_text

app = FastAPI()

class TextRequest(BaseModel):
    text: str

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transform-text")
async def transform_text(data: TextRequest):
    transformed, is_toxic = process_text(data.text)
    return {"transformed": transformed, "is_toxic": is_toxic}

@app.get("/health")
async def health():
    return {"status": "ok"}