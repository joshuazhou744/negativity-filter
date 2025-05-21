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
        credentials: Credentials = CREDENTIALS,
        model_id: str = MODEL_ID,
        project_id: str = PROJECT_ID,
        system_prompt: str = SYSTEM_PROMPT,
        max_tokens: int = 350
    ):
        self.placeholder = None
        # TODO: initialize the object fields
    
    # TODO: make a function to transform the text