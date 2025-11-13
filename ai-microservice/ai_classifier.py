import requests
import os
import tempfile
import numpy as np

# --- AI Library Imports ---
import torch
import whisper
import librosa 
from inference_sdk import InferenceHTTPClient # <-- NEW

# --- Global Models & Device ---
AUDIO_MODEL = None
INFERENCE_CLIENT = None # <-- NEW
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# --- Roboflow Config (Loaded from .env by ai-server.py) ---
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY")
ROBOFLOW_WORKSPACE_NAME = os.environ.get("ROBOFLOW_WORKSPACE_NAME") # <-- NEW
ROBOFLOW_WORKFLOW_ID = os.environ.get("ROBOFLOW_WORKFLOW_ID")     # <-- NEW

def load_models():
    """
    Loads and initializes the necessary AI models into memory.
    """
    global AUDIO_MODEL, INFERENCE_CLIENT
    print(f"AI_CLASSIFIER: Starting model loading process on device: {DEVICE}")
    
    # 1. Image Model (Roboflow API Client)
    if not all([ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE_NAME, ROBOFLOW_WORKFLOW_ID]):
        print("WARNING: Roboflow environment variables (API_KEY, WORKSPACE_NAME, WORKFLOW_ID) are not set.")
        print("         AI image classification will NOT work.")
    else:
        # Connect to the new serverless API
        INFERENCE_CLIENT = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY
        )
        print("AI_CLASSIFIER: Roboflow Inference Client initialized.")

    # 2. Audio Model (Whisper)
    AUDIO_MODEL = whisper.load_model("base", device=DEVICE)
    print("AI_CLASSIFIER: Speech-to-text (Whisper) model loaded.")

    print("AI_CLASSIFIER: All models initialized successfully.")

# --- Helper Functions for Inference ---
def _analyze_image_for_severity(image_url):
    """
    Sends the image URL to the Roboflow Workflow API for classification.
    """
    if INFERENCE_CLIENT is None:
        return {"error": "Roboflow client is not configured"}

    try:
        # 1. Run the workflow using the image URL
        result = INFERENCE_CLIENT.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE_NAME,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={
                "image": image_url # The SDK can handle URLs directly
            },
            use_cache=True
        )
        
        # 2. Process results
        if not result:
            print("Roboflow gave an empty result list.")
            return {"issueType": "other", "severityScore": 0, "tags": ["empty-result-list", "ai-classified"]}

        # Get the prediction dictionary for the first (and only) image
        pred_data = result[0].get('predictions')
        if not pred_data:
            print(f"Roboflow response missing 'predictions' key: {result[0]}")
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-predictions-key", "ai-classified"]}

        # Get the actual list of predictions
        # This key is also 'predictions' inside the first 'predictions' dict
        predictions_list = pred_data.get('predictions')
        
        if predictions_list is None: # Check for None, as [] is a valid (empty) response
            print(f"Roboflow response missing inner 'predictions' list: {pred_data}")
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-inner-list", "ai-classified"]}

        if not predictions_list:
            # This is the case from your logs: {'predictions': []}
            # The model ran but found no issues in the image.
            print("Roboflow analysis complete: No issues detected.")
            return {
                "issueType": "other",
                "severityScore": 0,
                "tags": ["no-issue-detected", "ai-classified"]
            }

        # SUCCESS! We have predictions. Get the one with the highest confidence.
        # This handles both classification and detection models.
        top_prediction = max(predictions_list, key=lambda p: p.get('confidence', 0.0))
        
        # 'class' is for detection, 'top' is for classification. Let's check both.
        issue_type = top_prediction.get('class', top_prediction.get('top', 'other'))
        confidence = top_prediction.get('confidence', 0.0)
        
        # Scale confidence (0.0-1.0) to severity score (0-10)
        severity_score = round(confidence * 10, 1)

        print(f"AI_CLASSIFIER: Analyzed image via Roboflow. Best detection: {issue_type} (Score: {severity_score})")

        return {
            "issueType": issue_type,
            "severityScore": severity_score,
            "tags": [issue_type.replace('_', '-'), "ai-classified"]
        }
    except Exception as e:
        print(f"AI_CLASSIFIER: Error during Roboflow image analysis: {e}")
        # Print the raw result if it exists, for more debugging
        if 'result' in locals():
            print(f"Roboflow Raw Response: {result}")
        return {"error": f"Failed to analyze image: {e}"}
        
def _process_audio_for_structure(audio_url, user_description):
    """
    Downloads audio, runs STT (Whisper), and does simple NLP.
    (This function is unchanged)
    """
    global AUDIO_MODEL
    if AUDIO_MODEL is None:
        return {"error": "Audio model is not loaded"}

    try:
        # 1. Download audio
        response = requests.get(audio_url)
        response.raise_for_status()

        # 2. Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".tmp") as tmpfile:
            tmpfile.write(response.content)
            
            # 3. Load and resample audio to 16kHz
            audio_data, _ = librosa.load(tmpfile.name, sr=16000)

            # 4. Run Whisper transcription
            result = AUDIO_MODEL.transcribe(audio_data, fp16=(DEVICE == "cuda"))
            transcribed_text = result.get("text", "").strip()

        print(f"AI_CLASSIFIER: Transcribed audio: '{transcribed_text}'")

        # 5. Simple NLP (Keyword matching on transcription)
        issue_type = "other" # Default
        severity_score = 3
        tags = ["voice-report", "ai-classified"]

        text_lower = transcribed_text.lower()
        if "pothole" in text_lower or "gadda" in text_lower:
            issue_type = "pothole"
            severity_score = 5
            tags.append("pothole")
        elif "garbage" in text_lower or "kooda" in text_lower or "trash" in text_lower:
            issue_type = "garbage"
            severity_score = 4
            tags.append("garbage")
        elif "street light" in text_lower or "light" in text_lower:
            issue_type = "street_light"
            severity_score = 3
            tags.append("street-light")

        print(f"AI_CLASSIFIER: Processed audio. Type: {issue_type}")

        return {
            "issueType": issue_type,
            "severityScore": severity_score,
            "tags": tags,
            "description": transcribed_text
        }
    except Exception as e:
        print(f"AI_CLASSIFIER: Error during audio processing: {e}")
        return {"error": f"Failed to process audio: {e}"}

# --- Main Public Functions ---

def classify_image(image_url, user_description):
    """
    Main function for image reports.
    """
    return _analyze_image_for_severity(image_url)

def classify_audio(audio_url, user_description):
    """
    Main function for audio reports.
    """
    if AUDIO_MODEL is None:
        return {"error": "NLP model not loaded"}, 500
    
    return _process_audio_for_structure(audio_url, user_description)