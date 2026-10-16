
import os
import psycopg

def get_db_connection():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        dbname=os.getenv("POSTGRES_DB", "fitness_db"),
        user=os.getenv("POSTGRES_USER", "fitness"),
        password=os.getenv("POSTGRES_PASSWORD")
    )
