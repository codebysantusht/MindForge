
import os
import re
import jwt

from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from pwdlib import PasswordHash

from ai_engine import generate_question, evaluate_answer

from database import (
    save_interview,
    get_interviews,
    get_analytics,
    get_interview_by_id,
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user_profile,
)


# Configuration
SECRET_KEY = os.getenv("INTERVIEWIQ_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

password_hash = PasswordHash.recommended()
security = HTTPBearer()


app = FastAPI(
    title="InterviewIQ API",
    description="Backend API for AI-powered mock interviews and user authentication.",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REQUEST MODELS

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    target_role: str = Field(min_length=1, max_length=150)
    experience_level: str = Field(min_length=1)
    interview_type: str = Field(min_length=1)


class GenerateQuestionRequest(BaseModel):
    role: str = Field(min_length=1)
    level: str = Field(min_length=1)
    interview_type: str = Field(min_length=1)


class EvaluateAnswerRequest(BaseModel):
    role: str = Field(min_length=1)
    level: str = Field(min_length=1)
    interview_type: str = Field(default="Technical", min_length=1)
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


# AUTHENTICATION HELPERS

def normalize_email(email):
    return email.strip().lower()


def validate_email(email):
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    if not re.match(pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )


def create_access_token(user_id):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Authentication is not configured on the server."
        )

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Authentication is not configured on the server."
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload.get("sub"))

    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


# GENERAL ENDPOINTS

@app.get("/")
def home():
    return {
        "message": "InterviewIQ API is running",
        "status": "online"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# AUTHENTICATION ENDPOINTS

@app.post("/api/auth/register", status_code=201)
def register(request: RegisterRequest):

    email = normalize_email(request.email)
    validate_email(email)

    if get_user_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    hashed_password = password_hash.hash(request.password)

    try:
        user_id = create_user(
            full_name=request.full_name,
            email=email,
            password_hash=hashed_password
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to create your account. Please try again."
        )

    user = get_user_by_id(user_id)

    return {
        "message": "Account created successfully.",
        "user": user
    }


@app.post("/api/auth/login")
def login(request: LoginRequest):

    email = normalize_email(request.email)
    user = get_user_by_email(email)

    if user is None or not password_hash.verify(
        request.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(user["id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": get_user_by_id(user["id"])
    }


@app.get("/api/auth/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):
    return current_user


@app.put("/api/auth/profile")
def update_my_profile(
    request: ProfileUpdateRequest,
    current_user=Depends(get_current_user)
):

    if request.experience_level not in [
        "Beginner",
        "Intermediate",
        "Advanced"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid experience level."
        )

    if request.interview_type not in [
        "Technical",
        "HR",
        "Mixed"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid interview type."
        )

    updated = update_user_profile(
        user_id=current_user["id"],
        full_name=request.full_name,
        target_role=request.target_role,
        experience_level=request.experience_level,
        interview_type=request.interview_type
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="User profile not found."
        )

    return {
        "message": "Profile updated successfully.",
        "user": get_user_by_id(current_user["id"])
    }



# AI INTERVIEW ENDPOINTS

@app.post("/api/generate-question")
def create_question(
    request: GenerateQuestionRequest,
    current_user=Depends(get_current_user)
):
    try:
        question = generate_question(
            request.role,
            request.level,
            request.interview_type
        )

        return {"question": question}

    except Exception as e:
        print("GENERATE QUESTION ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Unable to generate a question. Please try again."
        )


@app.post("/api/evaluate-answer")
def evaluate_response(
    request: EvaluateAnswerRequest,
    current_user=Depends(get_current_user)
):
    try:
        feedback = evaluate_answer(
            request.role,
            request.level,
            request.question,
            request.answer
        )

        interview_id = save_interview(
            role=request.role,
            level=request.level,
            interview_type=request.interview_type,
            question=request.question,
            answer=request.answer,
            feedback=feedback,
            user_id=current_user["id"]
        )

        return {
            "feedback": feedback,
            "interview_id": interview_id,
            "message": "Evaluation completed and interview saved successfully."
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to evaluate and save the answer. Please try again."
        )


# USER-SPECIFIC HISTORY AND ANALYTICS ENDPOINTS

@app.get("/api/history")
def interview_history(
    current_user=Depends(get_current_user)
):
    try:
        interviews = get_interviews(
            user_id=current_user["id"]
        )

        return {
            "total": len(interviews),
            "interviews": interviews
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve interview history."
        )


@app.get("/api/history/{interview_id}")
def interview_details(
    interview_id: int,
    current_user=Depends(get_current_user)
):
    interview = get_interview_by_id(
        interview_id,
        user_id=current_user["id"]
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found."
        )

    return interview


@app.get("/api/analytics")
def performance_analytics(
    current_user=Depends(get_current_user)
):
    try:
        return get_analytics(
            user_id=current_user["id"]
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve performance analytics."
        )
