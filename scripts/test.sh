#!/bin/bash
set -e

echo "Running Backend Tests..."
# Assumes running in an environment where python/pytest is available
# or use docker-compose exec if running against containers
cd backend
pytest
cd ..

echo "Tests Complete!"
