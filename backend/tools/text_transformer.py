# Text transformer using WatsonX and Llama 3

from ibm_watsonx_ai import Credentials, APIClient
from ibm_watsonx_ai.foundation_models import ModelInference

# global variable configuration
CREDENTIALS = Credentials(
    url = "https://us-south.ml.cloud.ibm.com"
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
NOTE THAT THE TRANSFORMED TEXT SHOULD BE THE SAME LENGTH TO THE ORIGINAL TEXT, WITHIN A FEW CHARACTERS LENGTH.
DO NOT ADD ANY HEADER OR FOOTER TO THE TEXT. NOTHING LIKE "Transformed text:" OR ANYTHING LIKE THAT.
"""


class TextTransformer:
    def __init__(
        self,
        credentials: Credentials,
        model_id: str,
        project_id: str,
        system_prompt: str,
        max_tokens: int = 350
    ):
        self.credentials = credentials
        self.model_id = model_id
        self.project_id = project_id
        self.system_prompt = system_prompt
        self.max_tokens = max_tokens
        # leading underscore access modifier labels the _client field as protected (only a label, not enforced)
        self._client = None
        self._initialize_client()
    
    # protected function to initialize the WatsonX client
    def _initialize_client(self):
        # credential verification
        if not self.credentials:
            raise ValueError("Credentials are required")
        
        # initialize WatsonX client
        try:
            self._client = APIClient(self.credentials)
        except Exception as e:
            raise
    
    def transform_text(
        self,
        toxic_text: str
    ) -> str:
        # check for empty text
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
            # print(response) uncomment to see the full response; for debugging
            transformed_text = response['choices'][0]['message']['content']
            return transformed_text.strip()
        
        except Exception as e:
            return "Error transforming text"

# wrapper function to get a TextTransformer object
def get_text_transformer() -> TextTransformer:
    return TextTransformer(
                credentials=CREDENTIALS, 
                model_id=MODEL_ID, 
                project_id=PROJECT_ID, 
                system_prompt=SYSTEM_PROMPT,
                max_tokens=350
            )