from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# get the parent directory so we can import the processor function
from processor import process_text

app = FastAPI()

class TextRequest(BaseModel):
    text: str

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # typically allowing all origins (*) isn't recommended, however it's required within this context
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

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)