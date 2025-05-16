# toxicity_detector.py
# Toxicity/Negativity detector using ToxicBERT
# https://huggingface.co/unitary/toxic-bert

import time
import numpy as np
from typing import Dict, Tuple
from pydantic import BaseModel

# ToxicBERT is east to use as it's wrapped nicely in a detoxify package
from detoxify import Detoxify

# threshold to decide whether or not a text is toxic, configurable
TOXICITY_THRESHOLD = 0.6

# TODO: toxicity result class
class ToxicityResult(BaseModel):
    placeholder: str

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
        # TODO: initialize the object fields
        self._model = None
        # TODO: initialize the model with a function

    # TODO: make a protected function to initialize the ToxicBERT model
    
    # TODO: make a protected function to format scores
    
    # TODO: make a protected function to print scores (for debugging)
    
    # TODO: public function to predict toxicity of text
    
    # TODO: public function to check if text is toxic
    
    # TODO: public function to get full toxicity details (for debugging)

# wrapper function to get a ToxicityDetector object
def get_toxicity_detector():
    print("Get toxicity detector")
