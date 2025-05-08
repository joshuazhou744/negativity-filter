import asyncio
import json
import websockets
from region_selector import select_region
from screen_capture import grab_chat_region
from ocr import extract_text_from_image
from toxicity import is_toxic
from transform import generate_polite_response

CHAT_REGION = select_region()

context_history = []

async def handler(ws, path):
    last_raw = None
    while True:
        img = grab_chat_region(CHAT_REGION)
        raw_text = extract_text_from_image(img)

        if raw_text and raw_text != last_raw:
            last_raw = raw_text

            if is_toxic(raw_text):
                polite = generate_polite_response(raw_text, context_history)
                
