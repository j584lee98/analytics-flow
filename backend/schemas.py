from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., max_length=72)

class User(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
