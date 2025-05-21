# processor.py
# Processing logic for the backend

import sys
from typing import Tuple

# import models
from tools.text_transformer import TextTransformer
from tools.toxicity_detector import ToxicityDetector

# instantiate models at module level
text_transformer = TextTransformer()
toxicity_detector = ToxicityDetector()

def process_text(text: str) -> Tuple[str, bool]:
    # check for empty text
    if not text or not text.strip():
        return text, False
    
    # check toxicity
    is_toxic, scores = toxicity_detector.is_toxic(text)

    # not toxic case
    if not is_toxic:
        return text, False
    
    # negativity detected, hence we transform the text
    # similar to lazy loading where we only transform the text when needed; this improves efficiency
    transformed_text = text_transformer.transform_text(text)

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