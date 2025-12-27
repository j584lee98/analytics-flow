# Analytics Flow

A full-stack application with FastAPI backend, Next.js frontend, and PostgreSQL database, fully containerized with Docker.

## Project Structure

- **backend/**: FastAPI application (Python)
  - `main.py`: Entry point and API routes
  - `models.py`: SQLAlchemy database models
  - `schemas.py`: Pydantic data schemas
  - `auth.py`: Authentication logic (JWT)
  - `database.py`: Database connection setup
- **frontend/**: Next.js application (TypeScript/React)
  - `app/`: App router pages (Home, Login, Register)
- **db/**: Database initialization scripts
- **docker-compose.yml**: Orchestration for all services

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1.  **Clone the repository** (if you haven't already).

2.  **Environment Variables**:
    The project comes with default environment variables in `docker-compose.yml` and `backend/main.py` for development. For production, ensure you set secure values. See `.env.example` for reference.

3.  **Run the Application**:
    You can use the provided `Makefile` for convenience or standard `docker-compose` commands.

    ```bash
    # Build and start services
    make up
    # OR
    docker-compose up -d --build
    ```

4.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8000](http://localhost:8000)
    - **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Development

### Useful Commands (Makefile)

- `make build`: Build docker images
- `make up`: Start services in background
- `make down`: Stop services
- `make logs`: View logs
- `make restart`: Restart services
- `make clean`: Stop services and remove volumes (resets DB)
- `make test-backend`: Run backend tests (inside container)

### Database

The database is initialized with `db/init.sql`. The data is persisted in a docker volume `postgres_data`. To reset the database completely, run `make clean`.

### Authentication

- **Register**: Create a new account at `/register`.
- **Login**: Login at `/login` to receive a JWT.
- **Protected Routes**: The home page `/` is protected and requires a valid token.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic, Passlib (Bcrypt), Python-Jose (JWT)
- **Frontend**: TypeScript, React, Next.js, Tailwind CSS
- **Database**: PostgreSQL
- **DevOps**: Docker, Docker Compose
