
import sqlite3
from database import get_db_connection

sqlite_connection = sqlite3.connect("data/practice.db")
postgres_connection = get_db_connection()

try:
    sqlite_cursor = sqlite_connection.cursor()
    postgres_cursor = postgres_connection.cursor()

    sqlite_cursor.execute("""
        SELECT id, exercise, weight, reps, performed_at
        FROM sets
    """)

    sets = sqlite_cursor.fetchall()

    for row in sets:
        postgres_cursor.execute("""
            INSERT INTO sets (id, exercise, weight, reps, performed_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, row)

    sqlite_cursor.execute("""
        SELECT id, weight, measured_at
        FROM body_weights
    """)

    body_weights = sqlite_cursor.fetchall()

    for row in body_weights:
        postgres_cursor.execute("""
            INSERT INTO body_weights (id, weight, measured_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, row)

    postgres_cursor.execute("""
        SELECT setval(
            pg_get_serial_sequence('sets', 'id'),
            COALESCE((SELECT MAX(id) FROM sets), 1),
            EXISTS(SELECT 1 FROM sets)
        )
    """)

    postgres_cursor.execute("""
        SELECT setval(
            pg_get_serial_sequence('body_weights', 'id'),
            COALESCE((SELECT MAX(id) FROM body_weights), 1),
            EXISTS(SELECT 1 FROM body_weights)
        )
    """)

    postgres_connection.commit()

    print(f"Processed {len(sets)} training sets")
    print(f"Processed {len(body_weights)} body weight records")

except Exception:
    postgres_connection.rollback()
    raise

finally:
    sqlite_connection.close()
    postgres_connection.close()
