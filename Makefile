.PHONY: build up down logs restart clean test-backend

# Build all services
build:
	docker-compose build

# Start all services in detached mode
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs for all services
logs:
	docker-compose logs -f

# Restart all services
restart: down up

# Clean up docker resources (volumes, orphans)
clean:
	docker-compose down -v --remove-orphans

# Run backend tests (requires running container or local setup)
# This assumes you want to run tests inside the backend container
test-backend:
	docker-compose exec backend pytest

# Shell into backend container
shell-backend:
	docker-compose exec backend /bin/bash

# Shell into frontend container
shell-frontend:
	docker-compose exec frontend /bin/sh

# Shell into db container
shell-db:
	docker-compose exec db psql -U user -d analytics_db
