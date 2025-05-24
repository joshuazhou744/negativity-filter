# app.py
# FastAPI backend for text processing

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
from pydantic import BaseModel
from processor import process_text


# initialize FastAPI app
app = FastAPI()

# request schema
class TextRequest(BaseModel):
    text: str

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # typically allowing all origins (*) isn't recommended, however it's required for this project
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# transform text
@app.post("/transform-text")
async def transform_text(data: TextRequest):
    transformed, is_toxic = process_text(data.text)
    return {"transformed": transformed, "is_toxic": is_toxic}

# check API health
@app.get("/health")
async def health():
    return {"status": "ok"}

# run the app
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)