# processor.py
# Processing logic for the backend

import sys
from typing import Tuple

# TODO: import models

def process_text(text: str) -> Tuple[str, bool]:
    # TODO: check for empty text
    
    # TODO: get the text transformer
    # TODO: get the toxicity detector
    
    # TODO: check toxicity

    # TODO: format scores
    
    # TODO: transform the text if negative
    transformed_text = "transformed text"

    return transformed_text, True

# TODO: make a test function to make sure the models are working
def test_process_text():
    print("Test process text")
    
# run this file to test the models
if __name__ == "__main__":
    test_process_text()