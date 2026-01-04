#!/bin/bash
set -e

echo "Running Backend Linting..."
cd backend

# Prefer the backend venv if present (works on Windows Git Bash and Linux/macOS)
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

$PYTHON_CMD -m flake8 .
cd ..

echo "Running Frontend Linting..."
cd frontend
npm run lint
cd ..

echo "Linting Complete!"
