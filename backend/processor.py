import sys
import json
import numpy as np
from typing import Dict, Any, Tuple, Optional

# import models
from tools.text_transformer import get_text_transformer
from tools.toxicity_detector import ToxicityDetector

def process_text(text: str) -> Tuple[str, bool]:
    # check for empty text
    if not text or not text.strip():
        return text, False
    
    text_transformer = get_text_transformer()
    toxicity_detector = ToxicityDetector()
    
    # first check toxicity
    is_toxic, scores = toxicity_detector.is_toxic(text)

    # toxicity scores returned by the ToxicBERT model (we can print these for logging/debugging)
    scores = toxicity_detector._format_scores(scores)
    
    # not toxic
    if not is_toxic:
        return text, False
    
    # negativity detect, hence we transform the text
    # similar to lazy loading where we only transform the text when needed; this improves efficiency
    transformed_text = text_transformer.transform_text(text)
    
    # simple catch for empty transformed text, shouldn't be triggered too often
    if not transformed_text:
        return text, False
        
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
    
if __name__ == "__main__":
    test_process_text()