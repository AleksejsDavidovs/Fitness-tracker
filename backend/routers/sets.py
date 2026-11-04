
from fastapi import APIRouter, HTTPException

from backend.database import get_db_connection
from backend.models import SetCreate, BulkSetCreate


router = APIRouter(
    prefix="/sets",
    tags=["Sets"]
)


@router.post("")
def create_set(set_data: SetCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO sets (exercise, weight, reps, performed_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id
            """, (
                set_data.exercise,
                set_data.weight,
                set_data.reps
            ))

            set_id = cursor.fetchone()[0]

        connection.commit()

        return {
            "id": set_id,
            "exercise": set_data.exercise,
            "weight": set_data.weight,
            "reps": set_data.reps
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.post("/bulk", status_code=201)
def create_bulk_sets(data: BulkSetCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id
                FROM workout_sessions
                WHERE id = %s
            """, (data.session_id,))

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Workout session not found"
                )

            created_ids = []

            for _ in range(data.sets_count):
                cursor.execute("""
                    INSERT INTO sets (
                        session_id,
                        exercise,
                        weight,
                        reps,
                        performed_at
                    )
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    RETURNING id
                """, (
                    data.session_id,
                    data.exercise.strip(),
                    data.weight,
                    data.reps
                ))

                created_ids.append(cursor.fetchone()[0])

        connection.commit()

        return {
            "session_id": data.session_id,
            "exercise": data.exercise.strip(),
            "weight": data.weight,
            "reps": data.reps,
            "sets_count": len(created_ids),
            "created_ids": created_ids
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.delete("/{set_id}")
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

        return {"deleted_id": set_id}

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.put("/{set_id}")
def update_set(set_id: int, set_data: SetCreate):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE sets
                SET exercise = %s, weight = %s, reps = %s
                WHERE id = %s
            """, (
                set_data.exercise,
                set_data.weight,
                set_data.reps,
                set_id
            ))

            updated_count = cursor.rowcount

        if updated_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No updated sets"
            )

        connection.commit()

        return {
            "id": set_id,
            "exercise": set_data.exercise,
            "weight": set_data.weight,
            "reps": set_data.reps
        }

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.get("")
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
                "performed_at": (
                    row[4].isoformat() if row[4] else None
                )
            })

        return result

    finally:
        connection.close()
