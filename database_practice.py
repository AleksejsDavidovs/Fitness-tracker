import os
import sqlite3
DATABASE_PATH = os.getenv("DATABASE_PATH", "practice.db")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

connection = sqlite3.connect(DATABASE_PATH)
cursor = connection.cursor()

class SetCreate(BaseModel):
    exercise: str
    weight: float
    reps: int

class BodyWeightCreate(BaseModel):
    weight: float


cursor.execute("""
    CREATE TABLE IF NOT EXISTS sets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise TEXT NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL
    )               
""")

cursor.execute("PRAGMA table_info(sets)")
columns = cursor.fetchall()

column_names = []

for column in columns:
    column_names.append(column[1])

if "performed_at" not in column_names:
    cursor.execute("""
        ALTER TABLE sets
        ADD COLUMN performed_at TEXT
    """)

cursor.execute("""
    UPDATE sets
    SET performed_at = CURRENT_TIMESTAMP
    WHERE performed_at IS NULL
""")

connection.commit()


cursor.execute("""
    CREATE TABLE IF NOT EXISTS body_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight REAL NOT NULL,
        measured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
""")

connection.commit()
connection.close()

@app.post("/sets")
def create_set(set_data: SetCreate):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO sets (exercise, weight, reps, performed_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (
            set_data.exercise,
            set_data.weight,
            set_data.reps
        )
    )
    
    connection.commit()

    set_id = cursor.lastrowid
    connection.close()

    return {
        "id": set_id,
        "exercise": set_data.exercise,
        "weight": set_data.weight,
        "reps": set_data.reps
    }

@app.post("/body-weights")
def create_body_weight(weight_data: BodyWeightCreate):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO body_weights (weight)
        VALUES (?)
    """,
    (weight_data.weight,)
    )

    connection.commit()
    weight_id = cursor.lastrowid

    cursor.execute("""
        SELECT id, weight, measured_at
        FROM body_weights
        WHERE id = ?
    """,
    (weight_id,)
    )

    row = cursor.fetchone()
    connection.close()

    return {
        "id": row[0],
        "weight": row[1],
        "measured_at": row[2]
    }

@app.get("/body-weights")
def get_body_weights():
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, weight, measured_at
        FROM body_weights
        ORDER BY measured_at ASC
    """)

    rows = cursor.fetchall()
    result = []

    for row in rows:
        weight_data = {
            "id": row[0],
            "weight": row[1],
            "measured_at": row[2]
        }

        result.append(weight_data)

    connection.close()

    return result

@app.delete("/body-weights/{weight_id}")
def delete_body_weight(weight_id: int):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM body_weights
        WHERE id = ?
    """,
    (weight_id,)
    )

    deleted_count = cursor.rowcount

    connection.commit()
    connection.close()

    if deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Weight record not found"
        )

    return {
        "deleted_id": weight_id
    }

@app.delete("/sets/{set_id}")
def delete_set(set_id: int):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
    DELETE FROM sets
    WHERE id = ?
    """,
    (set_id,)
    )
    deleted_count = cursor.rowcount
    connection.commit()
    connection.close()
    if deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Set not found"
        )
    
    return {
            "deleted_id": set_id
    }

@app.put("/sets/{set_id}")
def update_set(set_id: int, set_data: SetCreate):
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()
    cursor.execute("""
    UPDATE sets
    SET exercise = ?, weight = ?, reps = ?
    WHERE id = ?
    """,
    (set_data.exercise,
     set_data.weight,
     set_data.reps,
     set_id
     )
    )
    updated_count = cursor.rowcount
    connection.commit()
    connection.close()
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
    



@app.get("/sets")
def get_sets():
    connection = sqlite3.connect(DATABASE_PATH)

    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, exercise, weight, reps, performed_at
        FROM sets
        ORDER BY performed_at ASC
    """)

    rows = cursor.fetchall()
    result = []

    for row in rows:
        set_data = {
            "id": row[0],
            "exercise": row[1],
            "weight": row[2],
            "reps": row[3],
            "performed_at": row[4]
        }

        result.append(set_data)  

    connection.close()

    return result  

@app.get("/hello")
def hello():
    return {"message": "Docker Live Reload WORKS!"}