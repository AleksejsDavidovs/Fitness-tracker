from pydantic import BaseModel

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str

class SetCreate(BaseModel):
    exercise: str
    weight: float
    reps: int

class BodyWeightCreate(BaseModel):
    weight: float
