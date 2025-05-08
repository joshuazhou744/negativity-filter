# Positivity Filter

A simple toxicity filter that detects negative content and transforms it into positive alternatives.

## Setup

1. Clone this repository
2. Install the required dependencies:

```bash
pip install openai detoxify python-dotenv
```

3. Create a `.env` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Command Line Interface

Run the interactive command-line interface:

```bash
python test_filter.py
```

Or process a specific text:

```bash
python test_filter.py "This is some text to analyze"
```

### As a Library

You can also use the processor in your own code:

```python
from backend.processor import process_text

# Process a text
result = process_text("Text to analyze")

# Check if toxic
if result["is_toxic"]:
    print(f"Transformed: {result['transformed_text']}")
else:
    print("Text is not toxic")
```

## How It Works

1. The system uses Detoxify (based on ToxicBERT) to detect toxic content
2. If toxicity is detected, it uses OpenAI GPT to transform the text
3. The result includes both toxicity scores and the transformed text

## Project Structure

- `backend/models/toxicity_detector.py`: Toxicity detection using Detoxify
- `backend/models/text_transformer.py`: Text transformation using OpenAI
- `backend/processor.py`: Main processing logic
- `test_filter.py`: Command-line interface for testing

## Next Steps

- Web extension integration
- User interface improvements
- Performance optimizations