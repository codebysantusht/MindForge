
import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


# --------------------------------------------------
# 1. LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY was not found. Check your backend .env file."
    )


# --------------------------------------------------
# 2. INITIALIZE GEMINI CLIENT
# --------------------------------------------------

client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=120000)
)


# --------------------------------------------------
# 3. MODEL CONFIGURATION
# --------------------------------------------------

MODEL_NAME = "gemini-3.5-flash-lite"

FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
]

GENERATION_CONFIG = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(
        thinking_level="low"
    ),
    max_output_tokens=2048
)


# --------------------------------------------------
# 4. ERROR CLASSIFICATION
# --------------------------------------------------

TEMPORARY_ERRORS = [
    "503",
    "504",
    "UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "429",
    "RESOURCE_EXHAUSTED",
    "408",
    "TIMEOUT"
]

UNAVAILABLE_MODEL_ERRORS = [
    "404",
    "NOT_FOUND",
    "MODEL NOT FOUND"
]


# --------------------------------------------------
# 5. GEMINI GENERATION WITH AUTOMATIC FALLBACK
# --------------------------------------------------

def _generate(prompt):
    """
    Generate content using the primary Gemini model.

    If the primary model fails, automatically try fallback models.
    Temporary errors receive one retry before switching models.
    """

    models = [MODEL_NAME] + FALLBACK_MODELS

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

                # Skip models that are unavailable.
                if any(
                    marker in message
                    for marker in UNAVAILABLE_MODEL_ERRORS
                ):

                    print(
                        f"{model} is unavailable. "
                        "Switching to the next model..."
                    )

                    break

                # Retry temporary errors once.
                if any(
                    marker in message
                    for marker in TEMPORARY_ERRORS
                ):

                    if attempt == 0:

                        print(
                            f"Temporary error with {model}. "
                            "Retrying in 2 seconds..."
                        )

                        time.sleep(2)
                        continue

                    print(
                        f"{model} failed after retry. "
                        "Trying fallback model..."
                    )

                    break

                # Do not retry permanent errors such as invalid API keys.
                raise RuntimeError(
                    f"Gemini request failed with {model}: {error}"
                ) from error

    raise RuntimeError(
        "All Gemini models failed. "
        f"Last error: {last_error}"
    )


# --------------------------------------------------
# 6. GENERATE INTERVIEW QUESTION
# --------------------------------------------------

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


# --------------------------------------------------
# 7. EVALUATE CANDIDATE ANSWER
# --------------------------------------------------

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

        # Extract JSON from the response.
        start = raw_response.find("{")
        end = raw_response.rfind("}") + 1

        if start == -1 or end <= start:
            raise ValueError(
                "No JSON object was returned."
            )

        result = json.loads(raw_response[start:end])

        # Required response fields.
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

        # Validate list fields.
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

        # Ensure feedback lists are not empty.
        if not result["strengths"]:

            result["strengths"] = [
                "Review the answer against the scoring rubric."
            ]

        if not result["areas_for_improvement"]:

            result["areas_for_improvement"] = [
                "Consider adding more detail or a practical example."
            ]

        # Validate score.
        score = float(result["score"])

        if not 0 <= score <= 10:
            raise ValueError(
                "Score must be between 0 and 10."
            )

        # Validate rubric category totals.
        rubric_fields = [
            ("technical_correctness", 4),
            ("relevance", 2),
            ("clarity", 2),
            ("completeness", 2)
        ]

        category_total = 0

        for field, maximum in rubric_fields:

            value = result[field]

            if not isinstance(value, str) or "/" not in value:
                raise ValueError(
                    f"Invalid rubric format for {field}."
                )

            earned, possible = value.split("/", 1)

            earned = float(earned.strip())
            possible = float(possible.strip())

            if possible != maximum:
                raise ValueError(
                    f"Invalid maximum score for {field}."
                )

            if not 0 <= earned <= maximum:
                raise ValueError(
                    f"Invalid score for {field}."
                )

            category_total += earned

        if abs(category_total - score) > 0.01:
            raise ValueError(
                "Total score does not match rubric scores."
            )

        result["score"] = score

        return result

    except (
        ValueError,
        json.JSONDecodeError,
        TypeError
    ) as error:

        raise RuntimeError(
            "The AI returned feedback in an unexpected format. "
            "Please submit the answer again."
        ) from error
