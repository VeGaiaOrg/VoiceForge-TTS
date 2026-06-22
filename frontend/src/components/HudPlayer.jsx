import React, { useState, useEffect, useRef } from 'react';

const HudPlayer = ({ audioUrl, text, speed, wordBoundaries }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const activeWordRef = useRef(null);

  // Use word boundaries for exact sync
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Autoscroll to active word
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWordIndex]);

  useEffect(() => {
    // Setup Web Audio API for Spectrum Analyzer
    if (!audioRef.current || !canvasRef.current) return;

    const initAudioContext = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        try {
          sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
        } catch (e) {
          // Ignore if already connected
        }
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const drawSpectrum = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        ctx.fillStyle = `rgb(0, ${Math.min(255, 100 + barHeight)}, 255)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 2;
      }
      
      animationRef.current = requestAnimationFrame(drawSpectrum);
    };

    if (isPlaying) {
      initAudioContext();
      drawSpectrum();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.5, 2.0, 4.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  // Fallback data if word boundaries are empty
  const hasBoundaries = wordBoundaries && wordBoundaries.length > 0;
  const displayWords = hasBoundaries 
    ? wordBoundaries 
    : text.split(' ').map(w => ({ word: w }));

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(curr);
    setProgress((curr / dur) * 100);

    if (hasBoundaries) {
      // Exact word sync using wordBoundaries
      let newIndex = -1;
      for (let i = 0; i < wordBoundaries.length; i++) {
        if (curr >= wordBoundaries[i].start) {
          newIndex = i;
        } else {
          break; // Since it's sorted chronologically
        }
      }
      setActiveWordIndex(newIndex);
    } else {
      // Fallback fake sync based on time
      const wordProgress = Math.floor((curr / dur) * displayWords.length);
      setActiveWordIndex(Math.min(wordProgress, displayWords.length - 1));
    }
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="hud-container">
      {/* Left Panel - Playback */}
      <div className="hud-panel hud-left">
        <div className="hud-header">
          <span>[ PODCAST_CTRL ]</span>
          <button className="btn-cyber" style={{padding: '4px 12px', fontSize: '14px', borderRadius: '20px'}} onClick={cyclePlaybackRate}>
            SPEED: {playbackRate}x
          </button>
        </div>
        
        <div className="circular-player">
          <svg viewBox="0 0 250 250">
            <circle cx="125" cy="125" r={radius} className="circle-bg" />
            <circle 
              cx="125" 
              cy="125" 
              r={radius} 
              className="circle-progress" 
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="play-btn" onClick={togglePlay}>
            {isPlaying ? '||' : '▶'}
          </div>
        </div>

        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <canvas ref={canvasRef} className="spectrogram" width="400" height="100"></canvas>

        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={onTimeUpdate} 
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          autoPlay
        />
      </div>

      {/* Center Panel - Metadata */}
      <div className="hud-panel hud-center">
        <div className="hud-header" style={{width: '100%'}}>
          <span>[ METADATA ]</span>
        </div>
        
        <div className="cover-art">
          <h2>AI SYNTHESIS</h2>
        </div>
        
        <div className="meta-info">
          <h3>Generated Audio Stream</h3>
          <p>HOST: Neural TTS Engine</p>
          <p>BASE RATE: {speed}x</p>
        </div>

        <div style={{width: '100%', padding: '0 20px'}}>
          <label style={{color: 'var(--cyan-glow)', fontFamily: 'Share Tech Mono', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
            VOL: {Math.round(volume * 100)}%
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Right Panel - Transcript */}
      <div className="hud-panel hud-right">
        <div className="hud-header">
          <span>[ LYRICS_TRANSCRIPT ]</span>
          <span style={{cursor: 'pointer'}} onClick={() => window.location.reload()}>X</span>
        </div>
        
        <div className="transcript-container">
          {displayWords.map((wb, idx) => (
            <span 
              key={idx} 
              ref={idx === activeWordIndex ? activeWordRef : null}
              className={`transcript-word ${idx === activeWordIndex ? 'active' : ''} ${idx < activeWordIndex ? 'read' : ''}`}
              style={{ opacity: idx < activeWordIndex ? 0.5 : 1 }}
            >
              {wb.word}{" "} 
            </span>
          ))}
        </div>

        
        <div style={{display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--hud-border)', paddingTop: '16px'}}>
          <button className="btn-cyber" style={{flex: 1, fontSize: '14px'}}>SYNC</button>
          <button className="btn-cyber" style={{flex: 1, fontSize: '14px'}}>INDEX</button>
          <a href={audioUrl} download="podcast_ai.mp3" style={{flex: 1, display: 'block', textDecoration: 'none'}}>
            <button className="btn-cyber" style={{width: '100%', fontSize: '14px', background: 'rgba(0, 240, 255, 0.2)'}}>DOWNLOAD_MP3</button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HudPlayer;
