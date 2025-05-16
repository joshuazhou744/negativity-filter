# Toxicity/Negativity detector using ToxicBERT
# https://huggingface.co/unitary/toxic-bert

import time
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from pydantic import BaseModel
# ToxicBERT is wrapped nicely in a detoxify package, easy to use
from detoxify import Detoxify

# threshold to decide whether or not a text is toxic, configurable
TOXICITY_THRESHOLD = 0.6

# toxicity result class
class ToxicityResult(BaseModel):
    is_toxic: bool
    scores: Dict[str, float]
    overall_score: float
    primary_category: str
    primary_score: float

# ToxicBERT outputclass
class ModelResult(BaseModel):
    toxicity: float
    severe_toxicity: float
    obscene: float
    threat: float
    insult: float
    identity_attack: float

ZERO_SCORE = ModelResult(
    toxicity=0.0,
    severe_toxicity=0.0,
    obscene=0.0,
    threat=0.0,
    insult=0.0,
    identity_attack=0.0
)

class ToxicityDetector:
    def __init__(self, threshold: float = TOXICITY_THRESHOLD, model_type: str = "original"):
        self.threshold = threshold
        self.model_type = model_type
        # protected _model field
        self._model = None
        self._load_model()
    
    # protected function to initialize the ToxicBERT model
    def _load_model(self):
        start_time = time.time()
        try:
            self._model = Detoxify(self.model_type)
        except Exception as e:
            raise
    
    def _print_scores(self, scores: ModelResult):
        print("\nToxicity Scores:")
        for category, score in scores.dict().items():
            print(f"{category:20}: {score:.6f}")
    
    # public function to predict toxicity of text
    def predict(self, text: str) -> ModelResult:
        # check if no text; returns zero scores
        if not text or not text.strip():
            return ZERO_SCORE
        
        # predict toxicity
        try:
            model_result = self._model.predict(text)
            model_result = ModelResult(**model_result)
            # self._print_scores(model_result)
            return model_result
        except Exception as e:
            print(f"Error predicting toxicity: {e}")
            return ZERO_SCORE
    
    # public function to check if text is toxic
    def is_toxic(self, text: str) -> Tuple[bool, ModelResult]:
        scores = self.predict(text)
        is_toxic = scores.toxicity >= self.threshold
        
        return is_toxic, scores
    
    # public function to get toxicity details (for debugging)
    def get_toxicity_details(self, text: str) -> ToxicityResult:
        is_toxic, scores = self.is_toxic(text)
        
        scores_dict = scores.dict()
        max_category = max(scores_dict.items(), key=lambda x: x[1])
        
        return ToxicityResult(
            is_toxic=is_toxic,
            scores=scores_dict,
            overall_score=scores.toxicity,
            primary_category=max_category[0],
            primary_score=max_category[1]
        )

# wrapper function to get a ToxicityDetector object
def get_toxicity_detector() -> ToxicityDetector:
    return ToxicityDetector(threshold=TOXICITY_THRESHOLD)
