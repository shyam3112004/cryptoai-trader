# Stage 1: Build React Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Stage 2: Production Python FastAPI Backend & Static Server
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code
COPY backend ./backend

# Copy built frontend assets to backend static directory
COPY --from=frontend-builder /app/dist ./backend/static

# Set working directory to backend
WORKDIR /app/backend

# Set environment variables for Hugging Face Spaces
ENV PORT=7860
EXPOSE 7860

# Run uvicorn server on port 7860
CMD ["python", "main.py"]
