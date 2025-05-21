# toxicity_detector.py
# Toxicity/Negativity detector using ToxicBERT
# https://huggingface.co/unitary/toxic-bert

import time
from typing import Tuple
from pydantic import BaseModel

# ToxicBERT is east to use as it's wrapped nicely in a detoxify package
from detoxify import Detoxify

# threshold to decide whether or not a text is toxic, configurable
TOXICITY_THRESHOLD = 0.6

# model output class
class ModelOutput(BaseModel):
    toxicity: float
    severe_toxicity: float
    obscene: float
    threat: float
    insult: float
    identity_attack: float

ZERO_SCORE = ModelOutput(
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
            raise Exception("Error loading model")
    
    
    # public function to predict toxicity of text
    def predict(self, text: str) -> ModelOutput:

        # predict toxicity
        try:
            model_result = self._model.predict(text)
            model_result = ModelOutput(**model_result)
            # self._print_scores(model_result) uncomment to see scores
            return model_result
        except Exception as e:
            print(f"Error predicting toxicity: {e}")
            return ZERO_SCORE

    # public function to check if text is toxic
    def is_toxic(self, text: str) -> Tuple[bool, ModelOutput]:
        scores = self.predict(text)
        is_toxic = scores.toxicity >= self.threshold

        return is_toxic, scores
    
    # protected function to print scores (for debugging)
    def _print_scores(self, scores: ModelOutput):
        print("\nToxicity Scores:")
        for category, score in scores.dict().items():
            print(f"{category:20}: {score:.6f}")