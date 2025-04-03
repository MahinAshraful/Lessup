// src/components/MusicPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Howl, Howler } from 'howler';

const MusicPlayer = ({ song, effects }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const soundRef = useRef(null);
  const rainSoundRef = useRef(null);
  const thunderSoundRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize sound effects
  useEffect(() => {
    try {
      rainSoundRef.current = new Howl({
        src: [`${window.location.origin}/api/effects/rain.mp3`],
        loop: true,
        volume: 0,
        html5: true,
        onloaderror: () => {
          console.error('Error loading rain sound');
        }
      });
      
      thunderSoundRef.current = new Howl({
        src: [`${window.location.origin}/api/effects/thunder.mp3`],
        loop: true,
        volume: 0,
        html5: true,
        onloaderror: () => {
          console.error('Error loading thunder sound');
        }
      });
      
      console.log('Sound effects initialized');
    } catch (error) {
      console.error('Error initializing sound effects:', error);
    }
    
    return () => {
      try {
        if (rainSoundRef.current) {
          rainSoundRef.current.unload();
        }
        if (thunderSoundRef.current) {
          thunderSoundRef.current.unload();
        }
      } catch (error) {
        console.error('Error cleaning up sound effects:', error);
      }
    };
  }, []);
  
  // Load song when it changes
  useEffect(() => {
    setHasError(false);
    
    if (song?.url) {
      console.log('Loading song:', song.url);
      
      try {
        if (soundRef.current) {
          console.log('Unloading previous song');
          soundRef.current.unload();
        }
        
        soundRef.current = new Howl({
          src: [song.url],
          html5: true,
          onload: () => {
            console.log('Song loaded successfully');
            setDuration(soundRef.current.duration());
            setHasError(false);
          },
          onloaderror: (id, error) => {
            console.error('Error loading song:', error);
            setHasError(true);
          },
          onend: () => {
            console.log('Song playback ended');
            setIsPlaying(false);
            setCurrentTime(0);
          },
          onplay: () => {
            console.log('Song playback started');
          },
          onpause: () => {
            console.log('Song playback paused');
          }
        });
      } catch (error) {
        console.error('Error creating Howl instance:', error);
        setHasError(true);
      }
    }
    
    return () => {
      if (soundRef.current) {
        try {
          soundRef.current.unload();
        } catch (error) {
          console.error('Error unloading song:', error);
        }
      }
    };
  }, [song]);
  
  // Apply effects
  useEffect(() => {
    if (!soundRef.current) return;
    
    try {
      // Apply speed effect
      soundRef.current.rate(effects.speed);
      
      // Apply rain sound
      if (rainSoundRef.current) {
        const rainVolume = effects.rain / 100;
        rainSoundRef.current.volume(rainVolume);
        
        if (rainVolume > 0 && !rainSoundRef.current.playing()) {
          rainSoundRef.current.play();
        } else if (rainVolume === 0 && rainSoundRef.current.playing()) {
          rainSoundRef.current.stop();
        }
      }
      
      // Apply thunder sound
      if (thunderSoundRef.current) {
        const thunderVolume = effects.thunder / 100;
        thunderSoundRef.current.volume(thunderVolume);
        
        if (thunderVolume > 0 && !thunderSoundRef.current.playing()) {
          thunderSoundRef.current.play();
        } else if (thunderVolume === 0 && thunderSoundRef.current.playing()) {
          thunderSoundRef.current.stop();
        }
      }
    } catch (error) {
      console.error('Error applying effects:', error);
    }
  }, [effects]);
  
  const updateProgress = () => {
    if (soundRef.current) {
      try {
        const time = soundRef.current.seek();
        setCurrentTime(time);
        animationRef.current = requestAnimationFrame(updateProgress);
      } catch (error) {
        console.error('Error updating progress:', error);
        cancelAnimationFrame(animationRef.current);
      }
    }
  };
  
  const handlePlayPause = () => {
    if (!soundRef.current || hasError) return;
    
    try {
      if (isPlaying) {
        soundRef.current.pause();
        cancelAnimationFrame(animationRef.current);
      } else {
        soundRef.current.play();
        animationRef.current = requestAnimationFrame(updateProgress);
      }
      
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error handling play/pause:', error);
    }
  };
  
  const handleSkipBackward = () => {
    if (!soundRef.current || hasError) return;
    
    try {
      const newTime = Math.max(0, currentTime - 10);
      soundRef.current.seek(newTime);
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };
  
  const handleSkipForward = () => {
    if (!soundRef.current || hasError) return;
    
    try {
      const newTime = Math.min(duration, currentTime + 10);
      soundRef.current.seek(newTime);
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };
  
  const handleSeek = (e) => {
    if (!soundRef.current || hasError) return;
    
    try {
      const seekTime = (e.target.value / 100) * duration;
      soundRef.current.seek(seekTime);
      setCurrentTime(seekTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };
  
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="music-player">
      <div className="album-cover">
        {song?.coverUrl ? (
          <img src={song.coverUrl} alt="Album Cover" />
        ) : (
          <div className="album-placeholder">ALBUM COVER</div>
        )}
      </div>
      
      {hasError && (
        <div className="error-message">
          Error loading audio. Please try another file or check if the server is running.
        </div>
      )}
      
      <div className="song-info">
        <p className="song-name">{song?.title || 'Song Name'}</p>
        <p className="artist-name">{song?.artist || 'Artist Name'}</p>
      </div>
      
      <div className="player-controls">
        <button className="control-btn" onClick={handleSkipBackward} disabled={!song || hasError}>
          <span>⏮</span>
        </button>
        <button className="control-btn play-pause" onClick={handlePlayPause} disabled={!song || hasError}>
          <span>{isPlaying ? '⏸' : '▶'}</span>
        </button>
        <button className="control-btn" onClick={handleSkipForward} disabled={!song || hasError}>
          <span>⏭</span>
        </button>
      </div>
      
      <div className="progress-container">
        <input 
          type="range" 
          className="progress" 
          value={(currentTime / duration) * 100 || 0} 
          onChange={handleSeek}
          min="0" 
          max="100" 
          disabled={!song || hasError}
        />
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;