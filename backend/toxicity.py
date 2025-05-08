# toxicity classification using toxic bert

from detoxify import Detoxify

detector = Detoxify('original')

def is_toxic(text, threshold=0.3):
    scores = detector.predict(text)
    print(scores)
    return scores['toxicity'] >= threshold