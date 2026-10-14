
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi "uvicorn[standard]"

COPY database_practice.py .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "database_practice:app", "--host", "0.0.0.0", "--port", "8000"]
