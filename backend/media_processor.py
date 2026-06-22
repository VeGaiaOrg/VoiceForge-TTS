import librosa
import soundfile as sf
from pydub import AudioSegment
import os

def process_audio(input_wav: str, output_mp3: str, pitch_shift: float = 0.0, speed_multiplier: float = 1.0):
    # Load with librosa for pitch and speed adjustments if needed
    if pitch_shift != 0.0 or speed_multiplier != 1.0:
        y, sr = librosa.load(input_wav, sr=None)
        
        # Apply speed change
        if speed_multiplier != 1.0:
            # We use librosa.effects.time_stretch
            y = librosa.effects.time_stretch(y, rate=speed_multiplier)
            
        # Apply pitch shift
        if pitch_shift != 0.0:
            # pitch_shift in semitones
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch_shift)
            
        # Save temporary modified wav
        temp_wav = input_wav.replace(".wav", "_mod.wav")
        sf.write(temp_wav, y, sr)
        audio_to_convert = temp_wav
    else:
        audio_to_convert = input_wav

    # Convert to MP3 using pydub
    audio = AudioSegment.from_wav(audio_to_convert)
    audio.export(output_mp3, format="mp3", bitrate="192k")
    
    # Cleanup temp wav if created
    if audio_to_convert != input_wav and os.path.exists(audio_to_convert):
        os.remove(audio_to_convert)
