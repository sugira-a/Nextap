FROM node:20-bullseye AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=8080 \
    DATABASE_URL=sqlite:////app/nextap.db \
    FRONTEND_DIST_DIR=/app/dist

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend
COPY --from=frontend /app/dist ./dist

EXPOSE 8080
CMD ["python", "backend/run.py"]