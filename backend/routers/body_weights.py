
from fastapi import APIRouter, HTTPException

from backend.database import get_db_connection
from backend.models import BodyWeightCreate


router = APIRouter(
    prefix="/body-weights",
    tags=["Body Weights"]
)


@router.post("", status_code=201)
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

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


@router.get("")
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


@router.delete("/{weight_id}")
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

        return {"deleted_id": weight_id}

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()
