# Use a standard Python 3.10 image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (ffmpeg is needed for audio processing)
RUN apt-get update && apt-get install -y ffmpeg

# Copy your requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app code (ai-server.py, ai_classifier.py, yolov8n.pt)
COPY . .

# This command runs your server.
# Your ai-server.py is already set to use the $PORT variable provided by Hugging Face
#
CMD ["python", "ai-server.py"]