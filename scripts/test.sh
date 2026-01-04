#!/bin/bash
set -e

echo "Running Backend Tests..."
# Assumes running in an environment where python/pytest is available
# or use docker-compose exec if running against containers
cd backend

if [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON_CMD=".venv/Scripts/python.exe"
elif [ -f ".venv/bin/python" ]; then
    PYTHON_CMD=".venv/bin/python"
elif [ -f "../.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="../.venv/Scripts/python.exe"
elif [ -f "../.venv/bin/python" ]; then
    PYTHON_CMD="../.venv/bin/python"
else
    PYTHON_CMD="python"
fi

$PYTHON_CMD -m pytest
cd ..

echo "Tests Complete!"
