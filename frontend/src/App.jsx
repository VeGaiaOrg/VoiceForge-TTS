import { useState, useRef } from 'react'
import HudPlayer from './components/HudPlayer'

function App() {
  const [text, setText] = useState('')
  const [pitch, setPitch] = useState(0)
  const [speed, setSpeed] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [wordBoundaries, setWordBoundaries] = useState([])
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!text.trim()) return
    
    setIsGenerating(true)
    setError(null)
    setAudioUrl(null)
    setWordBoundaries([])

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          pitch: parseFloat(pitch),
          speed: parseFloat(speed)
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to generate audio')
      }

      const data = await response.json()
      
      // Decode Base64 audio into a Blob
      const byteCharacters = atob(data.audio_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      // Create local Object URL
      const fullAudioUrl = URL.createObjectURL(blob);
      
      setAudioUrl(fullAudioUrl)
      setWordBoundaries(data.word_boundaries || [])
      
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // If audio is generated, show the HUD Player instead of the Generator
  if (audioUrl) {
    return (
      <HudPlayer 
        audioUrl={audioUrl} 
        text={text} 
        speed={speed} 
        wordBoundaries={wordBoundaries}
      />
    );
  }

  return (
    <div className="generator-container">
      <h1>[ SYSTEM.INIT_TTS ]</h1>
      <p style={{color: 'var(--text-secondary)', marginBottom: '10px', fontFamily: '"Share Tech Mono", monospace'}}>
        INGRESE_SECUENCIA_DE_TEXTO_PARA_SINTETIZAR:
      </p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder=">_"
        spellCheck="false"
      />

      <div className="controls-row">
        <div className="control-group">
          <label>
            <span>PITCH_MODIFIER</span> <span>{pitch}</span>
          </label>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label>
            <span>TIME_SCALE</span> <span>{speed}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{color: '#ff003c', fontFamily: '"Share Tech Mono", monospace', fontSize: '14px', marginTop: '10px'}}>
          ERR: {error}
        </div>
      )}

      <button 
        className="btn-cyber" 
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim()}
        style={{marginTop: '20px'}}
      >
        {isGenerating ? 'PROCESSING_NEURAL_DATA...' : 'EXECUTE_SYNTHESIS'}
      </button>
    </div>
  )
}

export default App
