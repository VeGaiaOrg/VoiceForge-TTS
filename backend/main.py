from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import base64

from tts_engine import tts_engine

app = FastAPI(title="TTS Local Server", root_path="/api")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    pitch: float = 0.0
    speed: float = 1.0

# Ensure output directory exists (use /tmp for serverless environments)
OUTPUT_DIR = "/tmp/outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/generate")
async def generate_tts(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    session_id = str(uuid.uuid4())
    final_mp3_path = os.path.join(OUTPUT_DIR, f"{session_id}.mp3")
    
    try:
        # Edge-TTS output natively formats as MP3 and natively applies pitch and speed
        print(f"Generating audio for text: {request.text[:50]}...")
        _, word_boundaries = await tts_engine.generate_audio(
            text=request.text, 
            output_path=final_mp3_path, 
            pitch=request.pitch, 
            speed=request.speed
        )
        
        # Read the generated file and encode to Base64
        with open(final_mp3_path, "rb") as audio_file:
            audio_base64 = base64.b64encode(audio_file.read()).decode("utf-8")
            
        # Clean up the temp file
        try:
            os.remove(final_mp3_path)
        except Exception as cleanup_error:
            print(f"Warning: Could not remove temporary file {final_mp3_path}: {cleanup_error}")
            
        return {
            "message": "Success", 
            "audio_base64": audio_base64,
            "word_boundaries": word_boundaries
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
