import edge_tts
import asyncio

class TTSEngine:
    def __init__(self):
        # We use a premium Spanish voice from Microsoft by default
        self.voice = "es-MX-DaliaNeural"
        
    async def generate_audio(self, text: str, output_path: str, pitch: float = 0.0, speed: float = 1.0):
        # Calculate speed rate format (+20%, -10%, etc)
        rate_pct = int((speed - 1.0) * 100)
        rate_str = f"{rate_pct:+d}%"
        
        # Calculate pitch format. Edge-TTS accepts percentages like +10%, -5%
        # Let's map each frontend pitch step (which is roughly semitones) to 5Hz shift
        pitch_hz = int(pitch * 5)
        pitch_str = f"{pitch_hz:+d}Hz"
        
        print(f"Using Edge-TTS | Voice: {self.voice} | Rate: {rate_str} | Pitch: {pitch_str}")
        
        communicate = edge_tts.Communicate(
            text, 
            self.voice, 
            rate=rate_str, 
            pitch=pitch_str
        )
        
        word_boundaries = []
        with open(output_path, "wb") as file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    offset_sec = chunk["offset"] / 10000000.0
                    duration_sec = chunk["duration"] / 10000000.0
                    word_boundaries.append({
                        "word": chunk["text"],
                        "start": offset_sec,
                        "end": offset_sec + duration_sec
                    })
                    
        return output_path, word_boundaries

tts_engine = TTSEngine()
