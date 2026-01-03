from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., max_length=72)


class User(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class FileResponse(BaseModel):
    id: str
    filename: str
    upload_date: datetime

    model_config = ConfigDict(from_attributes=True)


class FileUpdate(BaseModel):
    filename: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
