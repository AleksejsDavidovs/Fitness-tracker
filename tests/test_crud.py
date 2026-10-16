
import os
import requests

API_URL = os.getenv("API_URL", "http://api-test:8000")


def test_exercise_crud():
    exercise_id = None

    try:
        # CREATE
        response = requests.post(
            f"{API_URL}/exercises",
            json={
                "name": "Docker Test Exercise",
                "muscle_group": "Chest"
            },
            timeout=5
        )

        assert response.status_code == 201

        exercise_id = response.json()["id"]

        # READ
        response = requests.get(
            f"{API_URL}/exercises",
            timeout=5
        )

        assert response.status_code == 200

        exercises = response.json()

        assert any(
            exercise["id"] == exercise_id
            for exercise in exercises
        )

        # UPDATE
        response = requests.put(
            f"{API_URL}/exercises/{exercise_id}",
            json={
                "name": "Updated Test Exercise",
                "muscle_group": "Back"
            },
            timeout=5
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Test Exercise"

        # DELETE
        response = requests.delete(
            f"{API_URL}/exercises/{exercise_id}",
            timeout=5
        )

        assert response.status_code == 200

        # DELETE AGAIN
        response = requests.delete(
            f"{API_URL}/exercises/{exercise_id}",
            timeout=5
        )

        assert response.status_code == 404

    finally:
        if exercise_id is not None:
            requests.delete(
                f"{API_URL}/exercises/{exercise_id}",
                timeout=5
            )
