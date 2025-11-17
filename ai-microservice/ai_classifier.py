# ai-microservice/ai_classifier.py

import requests 
import os
import tempfile 
import json 
import time  # <-- FIX: Added import for polling
from inference_sdk import InferenceHTTPClient 

# --- Global Models & Device ---
GLADIA_API_KEY = os.environ.get("GLADIA_API_KEY") 
GLADIA_API_URL = "https://api.gladia.io/v2/transcription"
INFERENCE_CLIENT = None # Roboflow client

# --- Roboflow Config (Loaded from .env by ai-server.py) ---
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY")
ROBOFLOW_WORKSPACE_NAME = os.environ.get("ROBOFLOW_WORKSPACE_NAME")
ROBOFLOW_WORKFLOW_ID = os.environ.get("ROBOFLOW_WORKFLOW_ID")

def load_models():
    """
    UPDATED: This function is now fast and lightweight.
    It only initializes API clients, not heavy local models.
    """
    global INFERENCE_CLIENT
    print("AI_CLASSIFIER: Starting API client initialization...")
    
    # 1. Image Model (Roboflow API Client)
    if not all([ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE_NAME, ROBOFLOW_WORKFLOW_ID]):
        print("WARNING: Roboflow environment variables are not set. Image classification will fail.")
    else:
        INFERENCE_CLIENT = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY
        )
        print("AI_CLASSIFIER: Roboflow Inference Client initialized.")

    # 2. Check for Gladia API Key
    if not GLADIA_API_KEY:
        print("CRITICAL WARNING: GLADIA_API_KEY is not set. Audio classification will fail.")

    print("AI_CLASSIFIER: Core API clients initialized successfully.")


# --- Helper Functions for Inference ---

def _analyze_image_for_severity(image_url):
    """
    Sends the image URL to the Roboflow Workflow API for classification.
    (This function is unchanged)
    """
    if INFERENCE_CLIENT is None:
        return {"error": "Roboflow client is not configured"}

    try:
        # This function's logic remains the same
        result = INFERENCE_CLIENT.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE_NAME,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={"image": image_url},
            use_cache=True
        )
        
        if not result:
            return {"issueType": "other", "severityScore": 0, "tags": ["empty-result-list", "ai-classified"]}

        pred_data = result[0].get('predictions')
        if not pred_data:
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-predictions-key", "ai-classified"]}

        predictions_list = pred_data.get('predictions')
        
        if predictions_list is None:
            return {"issueType": "other", "severityScore": 0, "tags": ["missing-inner-list", "ai-classified"]}

        if not predictions_list:
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
        return {"error": f"Failed to analyze image: {e}"}


def _process_audio_for_structure(audio_url, user_description):
    """
    FIXED: Handles Gladia's asynchronous API by polling the result_url
    AND correctly parsing the "result" key instead of "prediction".
    """
    if not audio_url or not audio_url.startswith('http'):
        return {"error": "Invalid or missing audio URL provided."}
    
    if not GLADIA_API_KEY:
        return {"error": "Gladia API key not configured"}

    try:
        # 1. Setup API Payload (This part is correct)
        headers = {
            "x-gladia-key": GLADIA_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "audio_url": audio_url,
            "diarization": False,
            "language_config": {
                "languages": [], # Empty array means auto-detect
                "code_switching": False
            }
        }

        # 2. Call Gladia to INITIATE the job
        initiate_response = requests.post(
            GLADIA_API_URL, 
            headers=headers, 
            data=json.dumps(payload),
            timeout=120 
        )
        initiate_response.raise_for_status()
        
        initiate_data = initiate_response.json()
        result_url = initiate_data.get("result_url")

        if not result_url:
            print(f"AI_CLASSIFIER: Gladia did not return a result_url. Response: {initiate_data}")
            raise Exception("Gladia failed to initiate job.")

        print(f"AI_CLASSIFIER: Gladia job initiated. Polling URL: {result_url}")

        # 3. Poll the result_url for the final transcription
        start_time = time.time()
        total_timeout = 110 
        
        while True:
            if time.time() - start_time > total_timeout:
                raise Exception("Gladia transcription polling timed out after 110 seconds.")

            poll_headers = {"x-gladia-key": GLADIA_API_KEY}
            poll_response = requests.get(result_url, headers=poll_headers)
            poll_response.raise_for_status()
            poll_data = poll_response.json()
            status = poll_data.get("status")

            if status == "done":
                print("AI_CLASSIFIER: Gladia job done.")

                # --- THIS IS THE FIX ---
                # The data is inside "result", not "prediction"
                result_data = poll_data.get("result", {})
                transcription_data = result_data.get("transcription", {})
                transcribed_text = transcription_data.get("full_transcript", "")
                # --- END OF FIX ---

                if not transcribed_text and transcription_data:
                    # Fallback for different response structures
                    transcribed_text = " ".join(u.get("transcription", "") for u in transcription_data.get("utterances", []))
                
                if not transcribed_text:
                    print(f"AI_CLASSIFIER: Gladia returned 'done' but transcript is empty. Response: {poll_data}")
                    raise Exception("Gladia returned an empty transcript.")
                
                break # Exit the loop
            
            elif status == "error":
                print(f"AI_CLASSIFIER: Gladia job failed. Response: {poll_data}")
                raise Exception(f"Gladia processing error: {poll_data.get('error')}")

            print(f"AI_CLASSIFIER: Gladia status: {status}. Polling again in 3 seconds...")
            time.sleep(3)
        

        print(f"AI_CLASSIFIER: Gladia Transcription: '{transcribed_text}'")

        # 4. Simple NLP (This part is correct)
        issue_type = "other" 
        severity_score = 3
        tags = ["voice-report", "ai-classified"]
        text_lower = transcribed_text.lower()
        
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
        elif not text_lower or len(text_lower) < 10:
            issue_type = "non-civic-issue" 
            tags.append("non-civic-issue")
            
        print(f"AI_CLASSIFIER: Processed audio. Type: {issue_type}")

        return {
            "issueType": issue_type,
            "severityScore": severity_score,
            "tags": tags,
            "description": transcribed_text 
        }
    except Exception as e:
        print(f"AI_CLASSIFIER: Error during audio processing: {e}")
        if 'poll_response' in locals() and poll_response.text:
            print(f"AI_CLASSIFIER: Gladia API raw error response: {poll_response.text}")
            return {"error": f"Failed to process audio: {e} - Gladia Response: {poll_response.text}"}
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
    # Removed the old `if AUDIO_MODEL is None:` check
    return _process_audio_for_structure(audio_url, user_description)