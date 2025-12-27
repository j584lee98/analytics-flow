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
