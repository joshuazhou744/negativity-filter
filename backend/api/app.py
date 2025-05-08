from fastapi import FastAPI
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))
from processor import process_text

app = FastAPI()

@app.get("/transform-text")
async def transform_text(text: str):
    return process_text(text)