
from fastapi import APIRouter, HTTPException

from backend.database import get_db_connection
from backend.models import WorkoutSessionCreate


router = APIRouter(
    prefix="/workout-sessions",
    tags=["Workout Sessions"]
)


@router.post("", status_code=201)
def create_workout_session(session: WorkoutSessionCreate):
    name = session.name.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Workout name cannot be empty"
        )

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO workout_sessions (name)
                VALUES (%s)
                RETURNING id, name, started_at
            """, (name,))

            row = cursor.fetchone()

        connection.commit()

        return {
            "id": row[0],
            "name": row[1],
            "started_at": row[2].isoformat()
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.get("")
def get_workout_sessions():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, started_at
                FROM workout_sessions
                ORDER BY started_at DESC, id DESC
            """)

            rows = cursor.fetchall()

        sessions = []

        for row in rows:
            sessions.append({
                "id": row[0],
                "name": row[1],
                "started_at": row[2].isoformat()
            })

        return sessions

    finally:
        connection.close()
