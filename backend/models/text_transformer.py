import time
from typing import Optional, Dict, Any, List

import openai
import os

from ibm_watsonx_ai.foundation_models.utils.enums import ModelType
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai import Credentials
import json

credentials = {
    "url"    : "https://us-south.ml.cloud.ibm.com",
    "api_key" : "" # Typically there is an API key you have to input here to use but we don't need it in CloudIDE
}
model_id = "ibm/granite-3-8b-instruct"
prompt = """
You are a toxicity filter. 
You are given text either with context or independently,
You will transform the text into a positive alternative.

You will only respond with the pure transformed text, nothing else. Don't put "Transformed text:" or anything like that in the response.

The transformed text should be grammatically correct within the context.
It should fit the sentence structure and form of the original text.
The capitalization should be consistent with original text
It should also be whimsical, creative and fun.
Get creative with it. You can make allusions, analogies and puns.
NOTE THAT THE TRANSFORMED TEXT SHOULD BE THE SAME LENGTH TO THE ORIGINAL TEXT.

For example:

Original: "You are horrible"
Transformed: "You are lovely!"
"""


class TextTransformer:
    def __init__(
        self,
        credentials: Credentials = credentials,
        model: str = model_id,
        prompt: str = prompt,
        max_tokens: int = 150,
        project_id: str = "skills-network"
    ):
        model = ModelInference(
            model_id=model_id,
            credentials=credentials,
            project_id=project_id,
            params={"max_tokens": max_tokens},
        )

        self.model = model
        self.prompt = prompt
    
    def transform_text(
        self,
        toxic_text: str,
        context: Optional[str] = None,
    ) -> str:
        if not toxic_text or not toxic_text.strip():
            return ""
        
        try:

            response = self.model.chat(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "text", "text": f"Original text: {toxic_text}\nContext: {context if context else 'no context'}"}
                        ],
                    }
                ]
            )
            return response['choices'][0]['message']['content'].strip()
        except Exception as e:
            return "Error transforming text"

def get_text_transformer() -> TextTransformer:
    return TextTransformer()