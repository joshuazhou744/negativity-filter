import time
import numpy as np
from typing import Dict, Any, Tuple, List, Optional

from detoxify import Detoxify

TOXICITY_THRESHOLD = 0.7

class ToxicityDetector:
    def __init__(self, threshold: float = TOXICITY_THRESHOLD, model_type: str = "original"):
        self.threshold = threshold
        self.model_type = model_type
        self._model = None
        self._load_model()
        
    def _load_model(self):
        start_time = time.time()
        try:
            self._model = Detoxify(self.model_type)
        except Exception as e:
            raise
    
    def _format_scores(self, scores: Dict[str, np.float32]) -> Dict[str, float]:
        return {k: float(f"{v:.6f}") for k, v in scores.items()}
    
    def _print_scores(self, scores: Dict[str, float]):
        print("\nToxicity Scores:")
        for category, score in scores.items():
            print(f"{category:20}: {score:.6f}")
    
    def predict(self, text: str) -> Dict[str, float]:
        if not text or not text.strip():
            return {
                "toxicity": 0.0,
                "severe_toxicity": 0.0,
                "obscene": 0.0,
                "threat": 0.0,
                "insult": 0.0,
                "identity_attack": 0.0
            }
        
        try:
            scores = self._model.predict(text)
            formatted_scores = self._format_scores(scores)
            return formatted_scores
        except Exception as e:
            return {
                "toxicity": 0.0,
                "severe_toxicity": 0.0,
                "obscene": 0.0,
                "threat": 0.0,
                "insult": 0.0,
                "identity_attack": 0.0
            }
    
    def is_toxic(self, text: str) -> Tuple[bool, Dict[str, float]]:
        scores = self.predict(text)
        is_toxic = scores["toxicity"] >= self.threshold
        
        return is_toxic, scores
    
    def get_toxicity_details(self, text: str) -> Dict[str, Any]:
        is_toxic, scores = self.is_toxic(text)
        
        max_category = max(scores.items(), key=lambda x: x[1])
        
        return {
            "is_toxic": is_toxic,
            "scores": scores,
            "overall_score": scores["toxicity"],
            "primary_category": max_category[0],
            "primary_score": max_category[1]
        }

def get_toxicity_detector(threshold: float = TOXICITY_THRESHOLD) -> ToxicityDetector:
    return ToxicityDetector(threshold=threshold)
