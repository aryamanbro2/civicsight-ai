import requests
import os
import tempfile
import numpy as np

# --- AI Library Imports ---
import torch
import librosa 
from inference_sdk import InferenceHTTPClient # For Roboflow
import whisperx # Import WhisperX

# --- Global Models & Device ---
AUDIO_MODEL = None
# ALIGNMENT_MODEL and METADATA are now loaded dynamically
INFERENCE_CLIENT = None # Roboflow client
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# --- Roboflow Config (Loaded from .env by ai-server.py) ---
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY")
ROBOFLOW_WORKSPACE_NAME = os.environ.get("ROBOFLOW_WORKSPACE_NAME")
ROBOFLOW_WORKFLOW_ID = os.environ.get("ROBOFLOW_WORKFLOW_ID")

def load_models():
    """
    Loads and initializes the necessary AI models into memory using WhisperX.
    """
    # FIX: Alignment models are no longer loaded here
    global AUDIO_MODEL, INFERENCE_CLIENT
    print(f"AI_CLASSIFIER: Starting model loading process on device: {DEVICE}")
    
    # 1. Image Model (Roboflow API Client)
    if not all([ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE_NAME, ROBOFLOW_WORKFLOW_ID]):
        print("WARNING: Roboflow environment variables (API_KEY, WORKSPACE_NAME, WORKFLOW_ID) are not set.")
        print("         AI image classification will NOT work.")
    else:
        INFERENCE_CLIENT = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY
        )
        print("AI_CLASSIFIER: Roboflow Inference Client initialized.")

    # 2. Audio Model (WhisperX Transcription Model)
    AUDIO_MODEL = whisperx.load_model("small", device=DEVICE, compute_type="float32")
    print("AI_CLASSIFIER: WhisperX Transcription (small) model loaded.")

    # 3. FIX: Alignment model is REMOVED from startup.
    #    It will be loaded dynamically based on detected language.

    print("AI_CLASSIFIER: Core models initialized successfully.")

# --- Helper Functions for Inference ---

def _analyze_image_for_severity(image_url):
    """
    Sends the image URL to the Roboflow Workflow API for classification.
    (This function is unchanged)
    """
    if INFERENCE_CLIENT is None:
        return {"error": "Roboflow client is not configured"}

    try:
        result = INFERENCE_CLIENT.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE_NAME,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={"image": image_url},
            use_cache=True
        )
        
        if not result:
            print("Roboflow gave an empty result list.")
            return {"issueType": "other", "severityScore": 0, "tags": ["empty-result-list", "ai-classified"]}

        pred_data = result[0].get('predictions')
        if not pred_data:
            print(f"Roboflow response missing 'predictions' key: {result[0]}")
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-predictions-key", "ai-classified"]}

        predictions_list = pred_data.get('predictions')
        
        if predictions_list is None:
            print(f"Roboflow response missing inner 'predictions' list: {pred_data}")
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-inner-list", "ai-classified"]}

        if not predictions_list:
            print("Roboflow analysis complete: No issues detected. Returning 'non-civic-issue'.")
            return {
                "issueType": "non-civic-issue",
                "severityScore": 0,
                "tags": ["no-issue-detected", "ai-classified"]
            }

        top_prediction = max(predictions_list, key=lambda p: p.get('confidence', 0.0))
        
        issue_type = top_prediction.get('class', top_prediction.get('top', 'other'))
        confidence = top_prediction.get('confidence', 0.0)
        
        severity_score = round(confidence * 10, 1)

        print(f"AI_CLASSIFIER: Analyzed image via Roboflow. Best detection: {issue_type} (Score: {severity_score})")

        return {
            "issueType": issue_type,
            "severityScore": severity_score,
            "tags": [issue_type.replace('_', '-'), "ai-classified"]
        }
    except Exception as e:
        print(f"AI_CLASSIFIER: Error during Roboflow image analysis: {e}")
        if 'result' in locals():
            print(f"Roboflow Raw Response: {result}")
        return {"error": f"Failed to analyze image: {e}"}

def _process_audio_for_structure(audio_url, user_description):
    """
    Downloads audio, runs WhisperX transcription (auto-detecting language),
    then dynamically loads the correct alignment model for high accuracy.
    """
    # FIX: Only check for AUDIO_MODEL
    global AUDIO_MODEL
    if AUDIO_MODEL is None:
        return {"error": "Audio models are not loaded"}

    try:
        # 1. Download audio
        response = requests.get(audio_url)
        response.raise_for_status()

        # 2. Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".tmp") as tmpfile:
            tmpfile.write(response.content)
            
            # 3. Load audio with WhisperX utility
            audio_data = whisperx.load_audio(tmpfile.name)
            
            # 4. Run Transcription (task="transcribe" is default)
            # Language is set to None for auto-detection
            result = AUDIO_MODEL.transcribe(
                audio_data, 
                batch_size=4, 
                language=None 
            ) 
            
            # --- DYNAMIC ALIGNMENT FIX ---
            # 5. Get detected language and load the correct alignment model
            detected_language = result["language"]
            print(f"AI_CLASSIFIER: Detected language: {detected_language}")

            try:
                # Attempt to load the alignment model for the *detected* language
                alignment_model, metadata = whisperx.load_align_model(
                    language_code=detected_language, 
                    device=DEVICE
                )
                print(f"AI_CLASSIFIER: Loaded alignment model for '{detected_language}'.")
            except ValueError:
                # Fallback to English if an alignment model for the
                # detected language (e.g., 'ur' - Urdu) is not available
                print(f"AI_CLASSIFIER: No default alignment model for '{detected_language}'. Falling back to 'en'.")
                alignment_model, metadata = whisperx.load_align_model(
                    language_code="en", 
                    device=DEVICE
                )
            # --- END OF FIX ---
            
            # 6. Run Alignment (Corrects hallucinations and improves word timing)
            aligned_result = whisperx.align(
                result["segments"], 
                alignment_model, # Use the dynamically loaded model
                metadata,        # Use the dynamically loaded metadata
                audio_data, 
                DEVICE
            )
            
            # 7. Get the final text (join all segments)
            transcribed_text = " ".join([segment["text"] for segment in aligned_result["segments"]]).strip()

        print(f"AI_CLASSIFIER: Aligned Transcription: '{transcribed_text}'")

        # 8. Simple NLP (Keyword matching on *transcribed* text)
        issue_type = "other" # Default
        severity_score = 3
        tags = ["voice-report", "ai-classified"]

        text_lower = transcribed_text.lower()
        
        # (Your keyword matching logic remains unchanged)
        if any(kw in text_lower for kw in ["pothole", "pit", "hole in the road", "road is broken", "deep hole"]):
            issue_type = "pothole"
            severity_score = 5
            tags.append("pothole")
        
        elif any(kw in text_lower for kw in ["garbage", "trash", "waste", "dump", "pile of trash"]):
            issue_type = "garbage"
            severity_score = 4
            tags.append("garbage")

        elif any(kw in text_lower for kw in ["street light", "streetlight", "light is out", "lamp is broken"]):
            issue_type = "street_light"
            severity_score = 3
            tags.append("street-light")
        
        # Check for non-civic issues (like silent audio or random speech)
        elif not text_lower or len(text_lower) < 10:
            issue_type = "non-civic-issue" 
            tags.append("non-civic-issue")
            
        print(f"AI_CLASSIFIER: Processed audio. Type: {issue_type}")

        return {
            "issueType": issue_type,
            "severityScore": severity_score,
            "tags": tags,
            "description": transcribed_text # Return the accurate, aligned transcription
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
    # FIX: Only check for AUDIO_MODEL
    if AUDIO_MODEL is None: 
        return {"error": "NLP models not loaded"}, 500
    
    return _process_audio_for_structure(audio_url, user_description)