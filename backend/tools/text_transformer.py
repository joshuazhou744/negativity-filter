# text_transformer.py
# Text transformer using WatsonX and Llama 3

# TODO: import necessary modules from WatsonX library

# TODO: global variable configuration
CREDENTIALS = Credentials(
    url = ""
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
        credentials: Credentials,
        model_id: str,
        project_id: str,
        system_prompt: str,
        max_tokens: int = 350
    ):
        # TODO: initialize the object fields
        # leading underscore access modifier labels the _client field as protected (only a label, not enforced)
        self._client = None
        # TODO: initialize the client with a function
    
    # TODO: make a protected function to initialize the WatsonX client
    
    # TODO: make a function to transform the text

# TODO: make a wrapper function to get a TextTransformer object