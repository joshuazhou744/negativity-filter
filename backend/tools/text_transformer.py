# text_transformer.py
# Text transformer using Watsonx.ai and Llama 3

from ibm_watsonx_ai import Credentials, APIClient
from ibm_watsonx_ai.foundation_models import ModelInference

# global variable configuration
CREDENTIALS = Credentials(
    url = "https://us-south.ml.cloud.ibm.com",
    # apikey = "NOT NEEDED IN CLOUDIDE"
)
MODEL_ID = "model id"
PROJECT_ID = "project id"
SYSTEM_PROMPT = """
system prompt
"""

# TextTransformer Object
class TextTransformer:
    def __init__(
        self,
        credentials: Credentials = CREDENTIALS,
        model_id: str = MODEL_ID,
        project_id: str = PROJECT_ID,
        system_prompt: str = SYSTEM_PROMPT,
        max_tokens: int = 350
    ):
        # TODO: initialize the object fields
        # leading underscore access modifier labels the _client field as protected (only a label, not enforced)
        self._client = None
        # TODO: initialize the client with a function
    
    # TODO: make a protected function to initialize the WatsonX client
    
    # TODO: make a function to transform the text