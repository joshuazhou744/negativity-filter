import openai
from dotenv import load_dotenv
import os

load_dotenv()
openai.api_key = os.getenv("OPENAI_KEY")

def generate_polite_response(original_text, context_history):
    prompt = (
        "You’re a friendly moderator. Rewrite the following chat message "
        "to be kind, joyful, whimsical, contextually appropriate, and grammatically correct:\n\n"
        f"Context: {context_history}\n"
        f"Offensive: {original_text}\n"
        "Polite version:"

        "An example of this could be:"
        "Change 'Your mother is fat' to 'Your mother is lovely!'"
        "Remember to make it lovely and whimsical!"
    )
    response = openai.ChatCompletion.create(
        modlel="gpt-4o-mini",
        messages=[{"role":"user","content":prompt}],
        msg_tokens=70
    )
    response_msg = response.choices[0].message.content.strip()
    print(response_msg)
    return response.choices[0].message.content.strip()