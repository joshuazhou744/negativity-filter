# processor.py
# Processing logic for the backend

import sys
from typing import Tuple

# TODO: import models

def process_text(text: str) -> Tuple[str, bool]:
    # check for empty text
    if not text or not text.strip():
        return text, False
    
    # TODO: get the text transformer
    # TODO: get the toxicity detector
    
    # TODO: check toxicity

    # TODO: format scores
    
    # TODO: transform the text if negative
    transformed_text = "transformed text"

    return transformed_text, True

# test function to make sure the models are working
def test_process_text():
    if len(sys.argv) != 2:
        # processor.py usage (for testing)
        print("Usage: python processor.py <text>")
        sys.exit(1)
        
    text = sys.argv[1]
    result = process_text(text)

    print("\n=== Text Processing Results ===")
    print(f"Input text: {text}")
    print(f"Output text: {result}")
    print("=============================\n")
    
# run this file to test the models
if __name__ == "__main__":
    test_process_text()