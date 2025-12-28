from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., max_length=72)


class User(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
