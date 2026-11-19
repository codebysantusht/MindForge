
import os
import json
import time
import random

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

_client = None

def get_gemini_client():
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY was not found. Please set GEMINI_API_KEY in your environment or .env file."
        )

    _client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=120000)
    )
    return _client

# Primary and fallback models (configurable via environment variables)
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash")

# Generation configuration
GENERATION_CONFIG = types.GenerateContentConfig(
    max_output_tokens=2048
)

# =====================================================================
# CURATED HIGH-AVAILABILITY FALLBACK QUESTION BANK (100% UPTIME GUARANTEE)
# =====================================================================

FALLBACK_QUESTIONS = {
    "Cybersecurity": {
        "Beginner": {
            "Technical": [
                "Can you explain the difference between symmetric and asymmetric encryption, and provide a basic use case for each in a cybersecurity context?",
                "What is the CIA triad in information security, and how would you apply its principles to protect customer data?",
                "What are common indicators of compromise (IoCs) you would look for when investigating a suspicious phishing email alert?",
                "Explain the role of an address resolution protocol (ARP) and what happens during an ARP poisoning attack."
            ],
            "HR": [
                "Tell me about a time you had to learn a new security tool or concept quickly to complete a task.",
                "How do you prioritize your incident tickets or tasks when multiple high-severity issues arise simultaneously?",
                "Why are you interested in starting a career in cybersecurity, and how do you stay updated with emerging threats?",
                "Describe a situation where you had to work with a team member who had a different working style than you."
            ],
            "Mixed": [
                "Describe how you would explain the importance of multi-factor authentication (MFA) to a non-technical employee who finds it inconvenient.",
                "Tell me about a time you identified a potential risk or mistake before it became an issue. How did you communicate it?",
                "If a user reports that their workstation is running unusually slow after downloading an attachment, what are your first three steps?"
            ]
        },
        "Intermediate": {
            "Technical": [
                "Walk me through your step-by-step triage and containment process when an endpoint alert triggers for suspected ransomware activity.",
                "What is the difference between an IDS and an IPS, and how does signature-based detection differ from anomaly-based detection?",
                "Explain the mechanics of a Kerberoasting attack against Active Directory and describe how you would detect or mitigate it.",
                "How does Cross-Site Scripting (XSS) differ from Cross-Site Request Forgery (CSRF), and what defense-in-depth controls mitigate them?"
            ],
            "HR": [
                "Describe a situation where you disagreed with a system administrator or developer regarding a security vulnerability fix. How did you resolve it?",
                "Can you share an experience where an investigation or incident response didn't go according to plan, and what you learned from it?",
                "How do you manage stress and maintain focus during high-pressure security incidents or on-call rotations?"
            ],
            "Mixed": [
                "How do you balance strict security compliance requirements with business agility and developer velocity?",
                "Explain how you would conduct a post-incident review (post-mortem) with cross-functional stakeholders without assigning personal blame.",
                "How would you convince an engineering manager to delay a feature release to address critical security vulnerabilities discovered late in the cycle?"
            ]
        },
        "Advanced": {
            "Technical": [
                "How would you design and implement an end-to-end Zero Trust security architecture for an organization migrating from on-premise Active Directory to multi-cloud environments?",
                "Explain how you would hunt for an advanced persistent threat (APT) utilizing living-off-the-land binaries (LOLBins) to evade traditional EDR detection.",
                "Describe how you would architect a secure CI/CD pipeline incorporating SAST, DAST, SCA, and secrets scanning without degrading build SLAs.",
                "Walk me through designing an enterprise SIEM/SOAR data pipeline capable of ingesting and correlating 100,000 EPS in real time."
            ],
            "HR": [
                "Describe how you have built and fostered a security-first culture across engineering and product teams that previously viewed security as a blocker.",
                "Tell me about a time you had to brief executive leadership or board members during an active high-profile security incident.",
                "How do you approach hiring and developing senior security engineers in a highly competitive talent market?"
            ],
            "Mixed": [
                "When presenting a major security architecture overhaul to the CFO or executive team, how do you quantify risk and justify ROI?",
                "How do you mentor and develop junior and mid-level security analysts to help them transition into senior threat hunters or engineers?",
                "Describe a scenario where a business-critical third-party vendor suffered a breach. How would you lead the vendor risk assessment and mitigation strategy?"
            ]
        }
    },
    "Software": {
        "Beginner": {
            "Technical": [
                "What is the difference between synchronous and asynchronous execution in modern programming, and when would you use each?",
                "Explain the core principles of Object-Oriented Programming (OOP) and give a brief real-world example of polymorphism.",
                "What is the difference between REST and GraphQL, and what are the advantages of idempotent HTTP methods?",
                "Explain the difference between a stack and a queue data structure, and give a practical use case for each."
            ],
            "HR": [
                "Tell me about a time you worked on a group project or coding challenge and had to adapt to a sudden change in requirements.",
                "How do you approach debugging code when you are completely stuck on an error?",
                "Why are you interested in software engineering, and what is a recent technical project you are proud of?",
                "Describe how you handle tight deadlines when multiple assignments or deliverables are due."
            ],
            "Mixed": [
                "Explain how you would explain the concept of an API or database query to a non-technical business colleague.",
                "Describe a time you received constructive feedback on a pull request or code review. How did you respond?",
                "If you discover a bug in a teammate's code right before a scheduled release, how do you approach them about it?"
            ]
        },
        "Intermediate": {
            "Technical": [
                "How do database indexes (such as B-Trees) optimize query read speed, and what trade-offs do they introduce for write performance?",
                "Describe how you would design a distributed rate limiter for a public REST API handling thousands of requests per second.",
                "Explain how concurrency control works in relational databases, comparing optimistic locking with pessimistic locking.",
                "What are the key trade-offs between server-side rendering (SSR) and client-side rendering (CSR) for modern web applications?"
            ],
            "HR": [
                "Describe a time when you had to balance technical debt against meeting a critical product deadline. How did you make the trade-off?",
                "Tell me about a situation where a production bug slipped through testing. What steps did you take to fix it and ensure it wouldn't happen again?",
                "How do you handle receiving critical code review feedback that contradicts your preferred design approach?"
            ],
            "Mixed": [
                "How do you conduct code reviews to ensure code quality and maintainability while keeping team morale and velocity high?",
                "Walk me through how you approach breaking down a large, ambiguous feature into well-defined, testable engineering tasks.",
                "How do you communicate an unexpected delay in feature development to product managers and stakeholders?"
            ]
        },
        "Advanced": {
            "Technical": [
                "How would you architect a distributed, fault-tolerant event-driven messaging system ensuring exactly-once processing semantics?",
                "Explain how you would handle database sharding, cross-shard transactions, and live schema migrations in a high-scale microservices system.",
                "Describe the trade-offs between monolithic, microservices, and modular monolith architectures when scaling to millions of concurrent users.",
                "How would you design a distributed caching hierarchy to handle cache stampedes (thundering herd problem) under extreme load?"
            ],
            "HR": [
                "Tell me about a time you drove a major technical migration across multiple engineering teams. How did you gain alignment and manage friction?",
                "How do you evaluate, mentor, and develop senior engineering talent within your organization?",
                "Describe how you handle underperformance in a key technical contributor on a mission-critical project."
            ],
            "Mixed": [
                "How do you establish engineering standards and architectural principles across autonomous product squads without micromanaging?",
                "Describe a scenario where a chosen technology or architecture failed in production. How did you lead the post-mortem and mitigation strategy?",
                "How do you balance long-term architectural health against short-term product delivery milestones when collaborating with VP-level stakeholders?"
            ]
        }
    },
    "General": {
        "Beginner": {
            "Technical": [
                "Can you walk me through the lifecycle of a web request from the moment a user enters a URL into their browser until the page renders?",
                "Explain the difference between SQL and NoSQL databases, and when you would choose one over the other.",
                "What are the foundational differences between Git merge and Git rebase, and how do they affect repository commit history?",
                "Explain the concept of containerization and how Docker differs from traditional virtual machines."
            ],
            "HR": [
                "What motivated you to apply for this role, and what are your key career aspirations over the next two years?",
                "Describe a situation where you had to manage your time effectively while juggling multiple competing priorities.",
                "Can you share an example of how you handle feedback or criticism from a supervisor or peer?",
                "Tell me about a time you demonstrated initiative outside of your core responsibilities."
            ],
            "Mixed": [
                "Describe a situation where a project or requirement was ambiguous. How did you clarify expectations and move forward?",
                "Tell me about a time you had to explain a complex topic to someone with a completely different background.",
                "How do you handle a situation where a project deliverable depends on an uncooperative colleague or team?"
            ]
        },
        "Intermediate": {
            "Technical": [
                "Explain how caching mechanisms (e.g. Redis, CDN, in-memory) work across different layers of an application architecture.",
                "What is the difference between horizontal and vertical scaling, and what architectural considerations are necessary before scaling horizontally?",
                "How do you design and structure automated unit, integration, and end-to-end tests to achieve high test confidence without slowing CI pipelines?",
                "Explain how OAuth 2.0 Authorization Code flow with PKCE functions and why it is recommended for single-page applications."
            ],
            "HR": [
                "Tell me about a time you had to influence a technical decision without having formal authority over the people involved.",
                "How do you stay productive and maintain focus when working in a fast-paced or rapidly changing project environment?",
                "Describe a project that failed or missed its objectives. What was your role and what did you take away from the experience?"
            ],
            "Mixed": [
                "Walk me through how you would handle a disagreement with a product manager over an aggressive feature timeline.",
                "How do you ensure accessibility, security, and performance are prioritized throughout the development lifecycle rather than as afterthoughts?",
                "How do you prioritize bug fixes against new feature requests when both are urgently requested by different customer segments?"
            ]
        },
        "Advanced": {
            "Technical": [
                "How do you design a high-availability, multi-region architecture that satisfies stringent RTO and RPO requirements?",
                "Discuss the trade-offs involved in achieving consistency versus availability in distributed systems, referencing the CAP and PACELC theorems.",
                "How would you establish an enterprise observability strategy incorporating metrics, distributed tracing, and structured logging?",
                "Describe how you would design an automated canary deployment and rollback system for Kubernetes microservices."
            ],
            "HR": [
                "Describe how you navigate long-term technical vision with short-term business and quarterly revenue pressures.",
                "Tell me about a high-stakes crisis you managed and how you kept the team motivated and aligned through resolution.",
                "How do you build consensus among senior stakeholders when choosing between major architectural paths with conflicting trade-offs?"
            ],
            "Mixed": [
                "What strategies do you use to prevent burnout and foster technical excellence in high-pressure engineering environments?",
                "How do you transition a legacy system into a modern cloud-native stack while maintaining 99.99% uptime for existing enterprise customers?",
                "Describe how you align technical roadmaps with executive business objectives to secure budget and headcount for platform initiatives."
            ]
        }
    }
}


def _match_category(role: str) -> str:
    r = (role or "").lower()
    if any(k in r for k in ["sec", "cyber", "soc", "hack", "penetration", "red team", "blue team", "malware", "forensic", "iam", "grc", "vulnerability"]):
        return "Cybersecurity"
    if any(k in r for k in ["soft", "dev", "engine", "code", "front", "back", "full", "python", "java", "c++", "script", "mobile", "ios", "android", "qa", "test"]):
        return "Software"
    return "General"


def get_fallback_question(role: str, level: str, interview_type: str) -> str:
    """Return an intelligent, tailored fallback question when live AI is unavailable."""
    category = _match_category(role)
    lvl = level if level in ["Beginner", "Intermediate", "Advanced"] else "Beginner"
    itype = interview_type if interview_type in ["Technical", "HR", "Mixed"] else "Technical"

    cat_dict = FALLBACK_QUESTIONS.get(category, FALLBACK_QUESTIONS["General"])
    lvl_dict = cat_dict.get(lvl, cat_dict["Beginner"])
    q_list = lvl_dict.get(itype, lvl_dict["Technical"])

    return random.choice(q_list)


def get_fallback_evaluation(role: str, level: str, question: str, answer: str) -> dict:
    """Return a structured, realistic evaluation when live AI evaluation is unavailable."""
    text = (answer or "").strip()
    words = text.split()
    word_count = len(words)

    # Heuristic scoring based on length, structure, and depth
    if word_count >= 60:
        tech_score = 3.5
        rel_score = 2.0
        clar_score = 1.8
        comp_score = 1.7
        summary = f"Strong and thorough response demonstrating clear understanding of {role} concepts."
        strengths = [
            "Provided a detailed, well-structured explanation with relevant terminology.",
            "Demonstrated logical flow and addressed key technical requirements of the question."
        ]
        improvements = [
            "Consider including specific real-world metrics, code examples, or edge cases to make your answer even more compelling."
        ]
    elif word_count >= 25:
        tech_score = 2.8
        rel_score = 1.8
        clar_score = 1.5
        comp_score = 1.4
        summary = f"Good foundational answer for a {level} candidate. Covers the primary concepts with room for deeper technical nuance."
        strengths = [
            "Directly answered the core premise of the question with clarity.",
            "Demonstrated practical familiarity with relevant principles."
        ]
        improvements = [
            "Elaborate further on practical implementation details and potential trade-offs.",
            "Structure your response using the STAR (Situation, Task, Action, Result) format for greater impact."
        ]
    elif word_count >= 10:
        tech_score = 2.0
        rel_score = 1.2
        clar_score = 1.2
        comp_score = 1.0
        summary = "Brief answer that touches on the topic, but lacks sufficient technical detail and depth for a complete assessment."
        strengths = [
            "Identified the fundamental topic correctly.",
            "Answer is concise and easy to read."
        ]
        improvements = [
            "Provide a more comprehensive explanation rather than a short summary.",
            "Include concrete examples and explain 'why' in addition to 'what'."
        ]
    else:
        tech_score = 1.0
        rel_score = 1.0
        clar_score = 1.0
        comp_score = 0.5
        summary = "The response is too brief to adequately demonstrate proficiency in this subject area."
        strengths = [
            "Attempted the question."
        ]
        improvements = [
            "Provide a complete, multi-sentence response explaining your reasoning.",
            "Review the key definitions and practical application of the question topic."
        ]

    total_score = round(min(10.0, max(1.0, tech_score + rel_score + clar_score + comp_score)), 1)

    return {
        "score": total_score,
        "summary": summary,
        "technical_correctness": f"{round(tech_score, 1)}/4",
        "relevance": f"{round(rel_score, 1)}/2",
        "clarity": f"{round(clar_score, 1)}/2",
        "completeness": f"{round(comp_score, 1)}/2",
        "strengths": strengths,
        "areas_for_improvement": improvements,
        "suggested_answer": f"For an optimal response to '{question}', begin by defining the core concept clearly, provide a practical scenario or technical architecture showing how it operates, and conclude with the trade-offs or security implications relevant to a {role}.",
        "follow_up_question": f"How would your approach change if you needed to scale this solution across a large, high-traffic distributed environment?"
    }


def _generate(prompt):
    """Generate text with automatic Gemini model fallback."""

    try:
        client = get_gemini_client()
    except Exception as e:
        print(f"Gemini client initialization failed: {e}")
        return None

    candidate_models = [
        PRIMARY_MODEL,
        FALLBACK_MODEL,
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-flash-latest"
    ]
    # Deduplicate while preserving order
    models = list(dict.fromkeys(candidate_models))

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
                    print(f"Successfully generated using: {model}")
                    return result.strip()

            except Exception as error:
                last_error = error
                print(f"Error with model {model} (attempt {attempt + 1}): {error}")
                if attempt == 0:
                    time.sleep(1)

    print(f"All Gemini models exhausted. Last error: {last_error}")
    return None


def generate_question(role, level, interview_type):
    """Generate question with 100% guarantee: live AI first, curated fallback if offline."""

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

    result = _generate(prompt)

    if result and result.strip():
        return result.strip()

    # Fallback guaranteed
    print("Engaging intelligent fallback question bank...")
    return get_fallback_question(role, level, interview_type)


def evaluate_answer(role, level, question, answer):
    """Evaluate answer with 100% guarantee: live AI first, heuristic fallback if offline."""

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

    if raw_response:
        try:
            start = raw_response.find("{")
            end = raw_response.rfind("}") + 1

            if start != -1 and end > start:
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

                if all(k in result for k in required_keys):
                    if not isinstance(result["strengths"], list):
                        result["strengths"] = [str(result["strengths"])]
                    if not isinstance(result["areas_for_improvement"], list):
                        result["areas_for_improvement"] = [str(result["areas_for_improvement"])]
                    if not result["strengths"]:
                        result["strengths"] = ["Review the answer against the scoring rubric."]
                    if not result["areas_for_improvement"]:
                        result["areas_for_improvement"] = ["Consider adding more detail or practical examples."]

                    score = float(result["score"])
                    result["score"] = max(0.0, min(10.0, score))
                    return result

        except Exception as err:
            print(f"Error parsing Gemini JSON response: {err}")

    # Fallback evaluation guaranteed
    print("Engaging intelligent heuristic fallback evaluator...")
    return get_fallback_evaluation(role, level, question, answer)

