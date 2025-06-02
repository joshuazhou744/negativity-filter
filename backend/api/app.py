# app.py
# FastAPI backend for text processing

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
from pydantic import BaseModel
from typing import List
from processor import process_text


# initialize FastAPI app
app = FastAPI()

# request schema
class BatchRequest(BaseModel):
    texts: List[str]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # typically allowing all origins (*) isn't recommended, however it's required for this project
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# transform text in batches
@app.post("/transform-text-batch")
async def transform_text_batch(data: BatchRequest):
    results = []
    for t in data.texts:
        transformed, toxic = process_text(t)
        results.append({"original": t, "transformed": transformed, "is_toxic": toxic})
    return results

# check API health
@app.get("/health")
async def health():
    return {"status": "ok"}

# run the app
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)