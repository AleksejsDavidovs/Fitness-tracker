
from fastapi import APIRouter, HTTPException

from backend.database import get_db_connection
from backend.models import ExerciseCreate


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"]
)


@router.get("")
def get_exercises():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, muscle_group
                FROM exercises
                ORDER BY id
            """)

            rows = cursor.fetchall()

        exercises = []

        for row in rows:
            exercises.append({
                "id": row[0],
                "name": row[1],
                "muscle_group": row[2]
            })

        return exercises

    finally:
        connection.close()


@router.post("", status_code=201)
def create_exercise(exercise: ExerciseCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO exercises (name, muscle_group)
                VALUES (%s, %s)
                RETURNING id
            """, (exercise.name, exercise.muscle_group))

            exercise_id = cursor.fetchone()[0]

        connection.commit()

        return {
            "id": exercise_id,
            "name": exercise.name,
            "muscle_group": exercise.muscle_group
        }

    finally:
        connection.close()


@router.put("/{exercise_id}")
def update_exercise(exercise_id: int, exercise: ExerciseCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE exercises
                SET name = %s, muscle_group = %s
                WHERE id = %s
            """, (
                exercise.name,
                exercise.muscle_group,
                exercise_id
            ))

            updated_count = cursor.rowcount

        if updated_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found"
            )

        connection.commit()

        return {
            "id": exercise_id,
            "name": exercise.name,
            "muscle_group": exercise.muscle_group
        }

    finally:
        connection.close()


@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: int):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM exercises
                WHERE id = %s
            """, (exercise_id,))

            deleted_count = cursor.rowcount

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found"
            )

        connection.commit()

        return {"deleted_id": exercise_id}

    finally:
        connection.close()
