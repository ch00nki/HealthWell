# Use official Python slim image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose default Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Command to run the app with Gunicorn
# 'main:app' → 'main' is the filename, 'app' is the Flask app object inside it
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app"]
