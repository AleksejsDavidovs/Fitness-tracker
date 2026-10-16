import os
import psycopg
DATABASE_PATH = os.getenv("DATABASE_PATH", "practice.db")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ExerciseCreate, SetCreate, BodyWeightCreate
from database import get_db_connection

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.post("/sets")
def create_set(set_data: SetCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO sets (exercise, weight, reps, performed_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id
                """,
                (
                    set_data.exercise,
                    set_data.weight,
                    set_data.reps
                )
            )
            set_id = cursor.fetchone()[0]
            connection.commit()

            return {
                "id": set_id,
                "exercise": set_data.exercise,
                "weight": set_data.weight,
                "reps": set_data.reps
            }
    finally:
         connection.close()


@app.post("/body-weights", status_code=201)
def create_body_weight(weight_data: BodyWeightCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO body_weights (weight)
                VALUES (%s)
                RETURNING id, weight, measured_at
            """, (weight_data.weight,))

            row = cursor.fetchone()

        connection.commit()

        return {
            "id": row[0],
            "weight": row[1],
            "measured_at": row[2]
        }

    finally:
        connection.close()


@app.get("/body-weights")
def get_body_weights():
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, weight, measured_at
                FROM body_weights
                ORDER BY measured_at ASC
            """)
            rows = cursor.fetchall()

        result = []

        for row in rows:
            result.append({
                "id": row[0],
                "weight": row[1],
                "measured_at": row[2]
            })

        return result

    finally:
        connection.close()


    


@app.delete("/body-weights/{weight_id}")
def delete_body_weight(weight_id: int):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM body_weights
                WHERE id = %s
            """, (weight_id,))

            deleted_count = cursor.rowcount

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Weight record not found"
            )

        connection.commit()

        return {
            "deleted_id": weight_id
        }

    finally:
        connection.close()



@app.delete("/sets/{set_id}")
def delete_set(set_id: int):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM sets
                WHERE id = %s
            """, (set_id,))

            deleted_count = cursor.rowcount

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Set not found"
            )

        connection.commit()

        return {
            "deleted_id": set_id
        }

    finally:
        connection.close()


@app.put("/sets/{set_id}")
def update_set(set_id: int, set_data: SetCreate):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
            UPDATE sets
            SET exercise = %s, weight = %s, reps = %s
            WHERE id = %s
            """,
            (set_data.exercise,
            set_data.weight,
            set_data.reps,
            set_id
            )
            )
            updated_count = cursor.rowcount
            connection.commit()
            
            if updated_count == 0:
                raise HTTPException(
                    status_code=404,
                    detail="No updated sets"
                )
            return {
                    "id": set_id,
                    "exercise": set_data.exercise,
                    "weight": set_data.weight,
                    "reps": set_data.reps
            }
    finally:
        connection.close()
    



@app.get("/sets")
def get_sets():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, exercise, weight, reps, performed_at
                FROM sets
                ORDER BY performed_at ASC
            """)

            rows = cursor.fetchall()
        result = []

        for row in rows:
            result.append({
                "id": row[0],
                "exercise": row[1],
                "weight": row[2],
                "reps": row[3],
                "performed_at": row[4].isoformat() if row[4] else None
            })

        return result
    finally:
        connection.close()


@app.get("/exercises")
def get_exercises():
    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, name, muscle_group
        FROM exercises
        ORDER BY id
    """)

    rows = cursor.fetchall()

    connection.close()

    exercises = []

    for row in rows:
        exercises.append({
            "id": row[0],
            "name": row[1],
            "muscle_group": row[2]
        })

    return exercises


@app.post("/exercises", status_code=201)
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



@app.put("/exercises/{exercise_id}")
def update_exercise(exercise_id: int, exercise: ExerciseCreate):
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE exercises
            SET name = %s, muscle_group = %s
            WHERE id = %s
        """, (exercise.name, exercise.muscle_group, exercise_id))

        updated_count = cursor.rowcount

        connection.commit()
        cursor.close()

        if updated_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Exercise not found"
            )

        return {
            "id": exercise_id,
            "name": exercise.name,
            "muscle_group": exercise.muscle_group
        }

    finally:
        connection.close()


@app.delete("/exercises/{exercise_id}")
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