# processor.py
# Processing logic for the backend

import sys
from typing import Tuple

# TODO: import models

# TODO: instantiate the text transformer
# TODO: instantiate the toxicity detector

def process_text(text: str) -> Tuple[str, bool]:
    # TODO: check for empty text
    
    # TODO: check toxicity

    # TODO: not toxic case, return text as is and False
    
    # negativity detected, hence we transform the text
    # TODO: transform the text if negative
    transformed_text = "transformed text"

    return transformed_text, True

# TODO: make a test function to make sure the models are working
def test_process_text():
    print("Test process text")
    
# run this file to test the models
if __name__ == "__main__":
    test_process_text()