import sys
import json
import numpy as np
from typing import Dict, Any, Tuple, Optional

from models.text_transformer import get_text_transformer
from models.toxicity_detector import get_toxicity_detector

def process_text(text: str) -> str:
    if not text or not text.strip():
        return text
    
    text_transformer = get_text_transformer()
    toxicity_detector = get_toxicity_detector()
    
    is_toxic, scores = toxicity_detector.is_toxic(text)

    scores = toxicity_detector._format_scores(scores)
    
    if not is_toxic:
        return text
        
    transformed_text = text_transformer.transform_text(text)
    
    if not transformed_text:
        return text
        
    return transformed_text

def test_process_text():
    if len(sys.argv) != 2:
        print("Usage: python processor.py <text>")
        sys.exit(1)
        
    text = sys.argv[1]
    result = process_text(text)

    print("\n=== Text Processing Results ===")
    print(f"Input text: {text}")
    print(f"Output text: {result}")
    print("=============================\n")
    
if __name__ == "__main__":
    print(process_text("I hate you"))