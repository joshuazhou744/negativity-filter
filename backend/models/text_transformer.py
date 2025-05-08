import time
from typing import Optional, Dict, Any, List

import openai
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4o-mini"
MAX_TOKENS = 200
PROMPT = """
You are a toxicity filter. 
You are given text either with context or independently,
You will transform the text into a positive alternative.

You will only respond with the pure transformed text, nothing else. Don't put "Transformed text:" or anything like that in the response.

The transformed text should be grammatically correct within the context.
It should fit the sentence structure and form of the original text.
The capitalization should be consistent with original text
It should also be whimsical, creative and fun.
Get creative with it. You can make allusions, analogies and puns.

For example:

Original: "You are horrible"
Transformed: "You are lovely!"

***
NOTE THAT THE TRANSFORMED TEXT SHOULD BE THE SAME LENGTH TO THE ORIGINAL TEXT.
"""


class TextTransformer:
    def __init__(
        self,
        api_key: str = OPENAI_API_KEY,
        model: str = OPENAI_MODEL,
        max_tokens: int = MAX_TOKENS,
        prompt: str = PROMPT
    ):
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.prompt = prompt
        self._client = None
        self._initialize_client()
        
    def _initialize_client(self):
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        try:
            self._client = OpenAI(api_key=self.api_key)
        except Exception as e:
            raise
    
    def transform_text(
        self,
        toxic_text: str,
        context: Optional[str] = None,
    ) -> str:
        if not toxic_text or not toxic_text.strip():
            return ""
        
        try:

            response = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.prompt},
                    {"role": "user", "content": f"Original text: {toxic_text}\nContext: {context if context else 'no context'}"}
                ],
                max_tokens=self.max_tokens,
                temperature=0.5
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return "Error transforming text"

def get_text_transformer() -> TextTransformer:
    return TextTransformer()