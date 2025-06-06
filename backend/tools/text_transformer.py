# text_transformer.py
# Text transformer using Watsonx.ai and Llama 3

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

# global variable configuration
CREDENTIALS = Credentials(
    url = "https://us-south.ml.cloud.ibm.com",
    # api_key = "not needed in CloudIDE"
)
MODEL_ID = "meta-llama/llama-3-3-70b-instruct"
PROJECT_ID = "skills-network"
SYSTEM_PROMPT = """
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
NOTE THAT THE TRANSFORMED TEXT SHOULD BE THE SAME LENGTH AS THE ORIGINAL TEXT, WITHIN A FEW CHARACTERS LENGTH.
DO NOT ADD ANY HEADER OR FOOTER TO THE TEXT. NOTHING LIKE "Transformed text:" OR ANYTHING LIKE THAT.
"""

class TextTransformer:
    def __init__(
        self,
        credentials: Credentials = CREDENTIALS,
        model_id: str = MODEL_ID,
        project_id: str = PROJECT_ID,
        system_prompt: str = SYSTEM_PROMPT,
        max_tokens: int = 350
    ):
        self.credentials = credentials
        self.model_id = model_id
        self.project_id = project_id
        self.system_prompt = system_prompt
        self.max_tokens = max_tokens

    # public function to transform text
    def transform_text(self, toxic_text: str) -> str:
        try:
            model = ModelInference(
                model_id=self.model_id,
                credentials=self.credentials,
                project_id=self.project_id,
                params={"max_tokens": self.max_tokens},
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
            # print(response) uncomment to see the full response; for debugging
            transformed_text = response['choices'][0]['message']['content']
            return transformed_text.strip()
        except Exception as e:
            return "Error transforming text"