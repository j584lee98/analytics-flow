from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
from sqlalchemy.exc import OperationalError

from database import engine, Base
from routers import auth, files
from schemas import User
from auth import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables with retry
    max_retries = 5
    retry_delay = 2
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError as e:
            if i == max_retries - 1:
                raise e
            print(f"Database not ready, retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)


@app.get("/", response_model=dict)
def read_root(current_user: User = Depends(get_current_user)):
    return {"message": "Welcome to the protected API!", "user": current_user.username}
