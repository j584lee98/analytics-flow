#!/bin/bash
set -e

echo "Running Backend Linting..."
cd backend
flake8 .
cd ..

echo "Running Frontend Linting..."
cd frontend
npm run lint
cd ..

echo "Linting Complete!"
