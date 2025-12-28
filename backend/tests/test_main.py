import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path so that 'main' can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set env var before importing main/database to use SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from main import app  # noqa: E402
from database import Base, engine  # noqa: E402

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables and remove file
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test.db"):
        os.remove("./test.db")


def test_read_main():
    response = client.get("/")
    assert response.status_code == 401  # Should be unauthorized without token


def test_register_and_login():
    # 1. Register
    response = client.post(
        "/register",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data

    # 2. Login
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    token = data["access_token"]

    # 3. Access protected route
    response = client.get(
        "/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["user"] == "testuser"


def test_duplicate_registration():
    # Register first user
    client.post(
        "/register",
        json={"username": "user1", "email": "user1@example.com", "password": "password123"},
    )

    # Try to register with same email
    response = client.post(
        "/register",
        json={"username": "user2", "email": "user1@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

    # Try to register with same username
    response = client.post(
        "/register",
        json={"username": "user1", "email": "user2@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already taken"
