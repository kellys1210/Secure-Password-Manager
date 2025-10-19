FROM python:3.11-slim

# Copy requirements first for better caching
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy all files from project root
COPY . /app

# Set working directory
WORKDIR /app

# Install the package in development mode
RUN pip install -e .

EXPOSE 8080

CMD [ "python", "backend/app.py" ]
