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

class WorkoutSessionCreate(BaseModel):
    name: str

from pydantic import Field

class BulkSetCreate(BaseModel):
    session_id: int = Field(gt=0)
    exercise: str = Field(min_length=1)
    weight: float = Field(ge=0)
    reps: int = Field(gt=0)
    sets_count: int = Field(gt=0, le=50)