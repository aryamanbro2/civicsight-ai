from fastapi import FastAPI, Body, HTTPException, status
from pydantic import BaseModel, Field
import uvicorn
import os
import sys

# Assume the ai_classifier functions are structured as in the previous step
from ai_classifier import classify_image, classify_audio, load_models

# --- 1. Pydantic Request Model (Guarantees Data Contract) ---

class ReportRequest(BaseModel):
    """
    Defines the required input payload from the Node.js backend.
    FastAPI uses this for automatic validation, error handling, and Swagger documentation.
    """
    mediaUrl: str = Field(..., description="Public URL of the uploaded image or audio file (e.g., Cloudinary/S3).")
    description: str = Field(default="", description="User-provided text description or transcribed voice note.")

# --- 2. Configuration and App Initialization ---

# Initialize FastAPI app
app = FastAPI(
    title="CivicSight AI Microservice",
    description="High-performance service for AI-powered civic issue classification and scoring.",
    version="1.1.0",
    # Docs are automatically available at /docs (Swagger UI) and /redoc (Redoc)
)

# Get the port from environment variables, defaulting to 5000 for local run
PORT = int(os.environ.get('PORT', 5000))

# --- 3. Application Startup Event (Model Loading) ---

# This asynchronous handler replaces Flask's deprecated @app.before_first_request.
# It runs once before the application starts accepting any requests.
@app.on_event("startup")
def startup_event():
    """Load the heavy AI models when the server starts."""
    print("FASTAPI: Starting model loading process...")
    try:
        load_models() # Calling the synchronous function from ai_classifier.py
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to load AI models: {e}", file=sys.stderr)
        # In a production environment, failing to load models should prevent the service from starting
        sys.exit(1)


# --- 4. Routes ---

@app.get("/", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {
        "status": "AI Service Online (FastAPI, High-Performance)",
        "version": app.version,
        "docs_url": "/docs",
        "models_status": {
            "image_classifier": "Ready",
            "audio_nlp": "Ready"
        }
    }

@app.post("/api/ai/classify/image", status_code=status.HTTP_200_OK, tags=["Classification"])
async def classify_image_endpoint(report_data: ReportRequest):
    """
    Classifies the civic issue from an image URL using YOLOv8/Detectron2.
    """
    try:
        # Pydantic has already validated the input payload
        
        # Call the core classification logic from ai_classifier.py
        # FastAPI handles running this synchronous function in a separate thread.
        results = classify_image(report_data.mediaUrl, report_data.description)
        
        if results.get("error"):
            raise HTTPException(status_code=500, detail=results["error"])
            
        return results

    except HTTPException:
        # Re-raise explicit HTTP exceptions (like validation errors or 404s)
        raise
    except Exception as e:
        # Catch all other exceptions during model inference
        print(f"Error processing image classification: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Internal AI Processing Error: {e}"
        )


@app.post("/api/ai/classify/audio", status_code=status.HTTP_200_OK, tags=["Classification"])
async def classify_audio_endpoint(report_data: ReportRequest):
    """
    Processes and structures reports from a voice/audio URL using Whisper/NLP.
    """
    try:
        # Call the core audio processing logic from ai_classifier.py
        results = classify_audio(report_data.mediaUrl, report_data.description)

        if results.get("error"):
            raise HTTPException(status_code=500, detail=results["error"])
            
        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing audio classification: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Internal AI Processing Error: {e}"
        )

# --- 5. Server Start ---

if __name__ == '__main__':
    # Use uvicorn, the standard ASGI server for running FastAPI apps
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")