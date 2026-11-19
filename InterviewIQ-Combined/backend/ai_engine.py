
import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY was not found. Check your .env file."
    )

# Initialize Gemini client
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=120000)
)

# Primary and fallback models
MODEL_NAME = "gemini-3.6-flash"
FALLBACK_MODEL = "gemini-3.8-flash"

# Generation configuration
GENERATION_CONFIG = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(
        thinking_level="low"
    ),
    max_output_tokens=2048
)


def _generate(prompt):
    """Generate text with automatic Gemini model fallback."""

    models = [MODEL_NAME, FALLBACK_MODEL]

    temporary_errors = [
        "503",
        "504",
        "UNAVAILABLE",
        "DEADLINE_EXCEEDED",
        "429",
        "RESOURCE_EXHAUSTED",
        "NOT_FOUND",
        "404"
    ]

    last_error = None

    for model in models:

        for attempt in range(2):

            try:
                print(f"Trying Gemini model: {model}")

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=GENERATION_CONFIG
                )

                result = response.text

                if result and result.strip():
                    print(
                        f"Successfully generated using: {model}"
                    )
                    return result.strip()

                raise RuntimeError(
                    "Gemini returned an empty response."
                )

            except Exception as error:

                last_error = error
                message = str(error).upper()

                is_temporary = any(
                    marker in message
                    for marker in temporary_errors
                )

                if is_temporary and attempt == 0:
                    print(
                        f"Temporary error with {model}. Retrying..."
                    )
                    time.sleep(2)
                    continue

                if is_temporary:
                    print(
                        f"{model} unavailable. "
                        "Trying fallback model..."
                    )
                    break

                raise RuntimeError(
                    f"Gemini request failed with {model}: {error}"
                ) from error

    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_error}"
    )


def generate_question(role, level, interview_type):

    prompt = f"""
You are a professional interview coach.

Generate exactly ONE complete interview question.

Job role: {role}
Experience level: {level}
Interview type: {interview_type}

Requirements:
- Make the question specific to the selected job role.
- Match the difficulty to the experience level.
- Technical: ask a relevant technical question.
- HR: ask a behavioral or situational question.
- Mixed: ask a suitable interview question.
- Return the full question in one or two sentences.
- Do not include the answer or an explanation.
"""

    return _generate(prompt)


def evaluate_answer(role, level, question, answer):

    prompt = f"""
You are a professional interview evaluator.

Evaluate the candidate's answer fairly and constructively.

Job role: {role}
Experience level: {level}
Interview question: {question}
Candidate answer: {answer}

SCORING RUBRIC:
- Technical correctness: 0-4
- Relevance: 0-2
- Clarity: 0-2
- Completeness: 0-2

Return a valid JSON object only.
Do not use Markdown code fences.

Use exactly this structure:

{{
  "score": 8,
  "summary": "Brief explanation of the score.",
  "technical_correctness": "4/4",
  "relevance": "2/2",
  "clarity": "1/2",
  "completeness": "1/2",
  "strengths": [
    "Specific strength 1",
    "Specific strength 2"
  ],
  "areas_for_improvement": [
    "Specific actionable improvement"
  ],
  "suggested_answer": "A complete, accurate improved answer.",
  "follow_up_question": "One relevant follow-up question."
}}

Rules:
- Include every field.
- Give at least two specific strengths.
- Give at least one actionable improvement.
- If the answer is excellent, suggest an advanced concept to explore.
- Score each category within its assigned maximum.
- The total score must equal the sum of all four categories.
- Be accurate, fair, concise, and constructive.
- Do not invent mistakes or candidate experience.
"""

    raw_response = _generate(prompt)

    try:

        start = raw_response.find("{")
        end = raw_response.rfind("}") + 1

        if start == -1 or end <= start:
            raise ValueError(
                "No JSON object was returned."
            )

        result = json.loads(raw_response[start:end])

        required_keys = [
            "score",
            "summary",
            "technical_correctness",
            "relevance",
            "clarity",
            "completeness",
            "strengths",
            "areas_for_improvement",
            "suggested_answer",
            "follow_up_question"
        ]

        for key in required_keys:
            if key not in result:
                raise ValueError(
                    f"Missing feedback field: {key}"
                )

        if not isinstance(result["strengths"], list):
            raise ValueError(
                "Strengths must be a list."
            )

        if not isinstance(
            result["areas_for_improvement"], list
        ):
            raise ValueError(
                "Improvement areas must be a list."
            )

        if not result["strengths"]:
            result["strengths"] = [
                "Review the answer against the scoring rubric."
            ]

        if not result["areas_for_improvement"]:
            result["areas_for_improvement"] = [
                "Consider adding more detail or a practical example."
            ]

        score = float(result["score"])

        if not 0 <= score <= 10:
            raise ValueError(
                "Score must be between 0 and 10."
            )

        result["score"] = score

        return result

    except (ValueError, json.JSONDecodeError, TypeError) as error:

        raise RuntimeError(
            "The AI returned feedback in an unexpected format. "
            "Please submit the answer again."
        ) from error
