
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import exercises, sets, body_weights, sessions


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(exercises.router)
app.include_router(sets.router)
app.include_router(body_weights.router)
app.include_router(sessions.router)
