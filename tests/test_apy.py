
import os
import requests

API_URL = os.getenv("API_URL", "http://api-test:8000")


def test_get_exercises():
    response = requests.get(
        f"{API_URL}/exercises",
        timeout=5
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_sets():
    response = requests.get(
        f"{API_URL}/sets",
        timeout=5
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_body_weights():
    response = requests.get(
        f"{API_URL}/body-weights",
        timeout=5
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
