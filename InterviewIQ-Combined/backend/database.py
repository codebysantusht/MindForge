
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone


# Database configuration
import os

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

DB_PATH = Path(
    os.getenv(
        "DATABASE_PATH",
        str(DATA_DIR / "interviewiq.db")
    )
)

DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    """Initialize user and interview tables."""

    with get_connection() as connection:

        # User accounts
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                target_role TEXT DEFAULT 'Cybersecurity Analyst',
                experience_level TEXT DEFAULT 'Beginner',
                interview_type TEXT DEFAULT 'Technical',
                created_at TEXT NOT NULL
            )
        """)

        # Interview records
        connection.execute("""
            CREATE TABLE IF NOT EXISTS interviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                level TEXT NOT NULL,
                interview_type TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                score REAL,
                feedback TEXT NOT NULL,
                created_at TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Migrate existing databases without deleting records.
        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(interviews)"
            ).fetchall()
        }

        if "user_id" not in columns:
            connection.execute("""
                ALTER TABLE interviews
                ADD COLUMN user_id INTEGER REFERENCES users(id)
            """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_interviews_user_id
            ON interviews(user_id)
        """)

        connection.commit()


# USER FUNCTIONS

def create_user(
    full_name,
    email,
    password_hash
):
    """Create a new user account."""

    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO users (
                full_name,
                email,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?)
        """, (
            full_name.strip(),
            email.strip().lower(),
            password_hash,
            created_at
        ))

        connection.commit()

        return cursor.lastrowid


def get_user_by_email(email):
    """Find a user by email address."""

    with get_connection() as connection:
        row = connection.execute("""
            SELECT *
            FROM users
            WHERE email = ?
        """, (email.strip().lower(),)).fetchone()

        return dict(row) if row else None


def get_user_by_id(user_id):
    """Retrieve a user profile without exposing the password hash."""

    with get_connection() as connection:
        row = connection.execute("""
            SELECT
                id,
                full_name,
                email,
                target_role,
                experience_level,
                interview_type,
                created_at
            FROM users
            WHERE id = ?
        """, (user_id,)).fetchone()

        return dict(row) if row else None


def update_user_profile(
    user_id,
    full_name,
    target_role,
    experience_level,
    interview_type
):
    """Update a user's profile and interview preferences."""

    with get_connection() as connection:
        cursor = connection.execute("""
            UPDATE users
            SET
                full_name = ?,
                target_role = ?,
                experience_level = ?,
                interview_type = ?
            WHERE id = ?
        """, (
            full_name.strip(),
            target_role,
            experience_level,
            interview_type,
            user_id
        ))

        connection.commit()

        return cursor.rowcount > 0


# INTERVIEW FUNCTIONS

def save_interview(
    role,
    level,
    interview_type,
    question,
    answer,
    feedback,
    user_id=None
):
    """Save a completed interview evaluation."""

    score = feedback.get("score")
    created_at = datetime.now(timezone.utc).isoformat()
    feedback_json = json.dumps(feedback)

    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO interviews (
                role,
                level,
                interview_type,
                question,
                answer,
                score,
                feedback,
                created_at,
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            role,
            level,
            interview_type,
            question,
            answer,
            score,
            feedback_json,
            created_at,
            user_id
        ))

        connection.commit()

        return cursor.lastrowid


def get_interviews(limit=100, user_id=None):
    """Retrieve recent interviews."""

    with get_connection() as connection:

        if user_id is not None:
            rows = connection.execute("""
                SELECT *
                FROM interviews
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit)).fetchall()
        else:
            rows = connection.execute("""
                SELECT *
                FROM interviews
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,)).fetchall()

        interviews = []

        for row in rows:
            interview = dict(row)
            interview["feedback"] = json.loads(interview["feedback"])
            interviews.append(interview)

        return interviews


def get_interview_by_id(interview_id, user_id=None):
    """Retrieve an interview by ID."""

    with get_connection() as connection:

        if user_id is not None:
            row = connection.execute("""
                SELECT *
                FROM interviews
                WHERE id = ? AND user_id = ?
            """, (interview_id, user_id)).fetchone()
        else:
            row = connection.execute("""
                SELECT *
                FROM interviews
                WHERE id = ?
            """, (interview_id,)).fetchone()

        if row is None:
            return None

        interview = dict(row)
        interview["feedback"] = json.loads(interview["feedback"])

        return interview


def get_analytics(user_id=None):
    """Calculate interview performance statistics."""

    with get_connection() as connection:

        if user_id is not None:
            stats = connection.execute("""
                SELECT
                    COUNT(*) AS total_interviews,
                    AVG(score) AS average_score,
                    MAX(score) AS best_score
                FROM interviews
                WHERE user_id = ?
            """, (user_id,)).fetchone()

            score_distribution = connection.execute("""
                SELECT score, COUNT(*) AS count
                FROM interviews
                WHERE user_id = ? AND score IS NOT NULL
                GROUP BY score
                ORDER BY score
            """, (user_id,)).fetchall()

            recent_scores = connection.execute("""
                SELECT id, role, score, created_at
                FROM interviews
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            """, (user_id,)).fetchall()

        else:
            stats = connection.execute("""
                SELECT
                    COUNT(*) AS total_interviews,
                    AVG(score) AS average_score,
                    MAX(score) AS best_score
                FROM interviews
            """).fetchone()

            score_distribution = connection.execute("""
                SELECT score, COUNT(*) AS count
                FROM interviews
                WHERE score IS NOT NULL
                GROUP BY score
                ORDER BY score
            """).fetchall()

            recent_scores = connection.execute("""
                SELECT id, role, score, created_at
                FROM interviews
                ORDER BY created_at DESC
                LIMIT 10
            """).fetchall()

        return {
            "total_interviews": stats["total_interviews"],
            "average_score": round(stats["average_score"], 2)
            if stats["average_score"] is not None else 0,
            "best_score": stats["best_score"] or 0,
            "score_distribution": [
                dict(row) for row in score_distribution
            ],
            "recent_scores": [
                dict(row) for row in recent_scores
            ]
        }


# Initialize database
init_db()
