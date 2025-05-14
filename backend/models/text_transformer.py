import time
from typing import Optional, Dict, Any, List

import openai
import os

from ibm_watsonx_ai import Credentials, APIClient
from ibm_watsonx_ai.foundation_models import ModelInference

credentials = Credentials(
    url = "https://us-south.ml.cloud.ibm.com"
)
model_id = "ibm/granite-3-3-8b-instruct"
project_id = "skills-network"
system_prompt = """
You are a toxicity filter. 
You are given text either with context or independently,
You will transform the text into a positive alternative.

You will only respond with the pure transformed text, nothing else. Don't put "Transformed text:" or anything like that in the response.

The transformed text should be grammatically correct within the context.
It should fit the sentence structure and form of the original text.
The capitalization should be consistent with original text.
There should only be punctuation if there was punctuation in the original text.
It should also be whimsical, creative and fun.
Get creative with it. You can make allusions, analogies and puns.

For example:

Original: "You are horrible"
Transformed: "You are lovely!"

***
NOTE THAT THE TRANSFORMED TEXT SHOULD BE THE SAME LENGTH TO THE ORIGINAL TEXT.
DO NOT ADD ANY HEADER OR FOOTER TO THE TEXT. NOTHING LIKE "Transformed text:" OR ANYTHING LIKE THAT.
"""


class TextTransformer:
    def __init__(
        self,
        credentials: Credentials = credentials,
        model_id: str = "ibm/granite-3-3-8b-instruct",
        project_id: str = project_id,
        system_prompt: str = system_prompt,
        max_tokens: int = 300
    ):
        self.credentials = credentials
        self.project_id = project_id
        self.system_prompt = system_prompt
        self.max_tokens = max_tokens
        self._client = None
        self._initialize_client()
        
    def _initialize_client(self):
        if not self.credentials:
            raise ValueError("Credentials are required")
        
        try:
            self._client = APIClient(credentials)
        except Exception as e:
            raise
    
    def transform_text(
        self,
        toxic_text: str
    ) -> str:
        if not toxic_text or not toxic_text.strip():
            return ""
        
        try:
            model = ModelInference(
                model_id=self.model_id,
                credentials=self.credentials,
                project_id=self.project_id,
                params={"max_tokens": 300},
            )

            response = model.chat(
                messages = [
                    {
                        "role":"system",
                        "content": [
                            {"type": "text", "text": self.system_prompt}
                        ]
                    },
                    {
                        "role":"user",
                        "content": [
                            {"type": "text", "text": f"Original text: {toxic_text}"}
                        ]
                    }
                ]
            )
            print(response)
            transformed_text = response['choices'][0]['message']['content']
            return transformed_text.strip()
        except Exception as e:
            return "Error transforming text"

def get_text_transformer() -> TextTransformer:
    return TextTransformer(credentials=credentials, project_id=project_id, system_prompt=system_prompt)