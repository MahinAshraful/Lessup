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
  const thunderTimerRef = useRef(null);
  const animationRef = useRef(null);
  const echoSoundRef = useRef(null);
  const echoTimerRef = useRef(null);
  const echoIntervalRef = useRef(null);
  
  // Schedule the next thunder sound with random delay
  const scheduleNextThunder = (intensity) => {
    // Clear any existing timer
    if (thunderTimerRef.current) {
      clearTimeout(thunderTimerRef.current);
    }
    
    // Only schedule next thunder if song is playing
    if (!isPlaying) return;
    
    // Calculate random delay between 1-4 seconds (1000-4000ms)
    // More intense thunder (higher slider value) means slightly shorter delays
    const minDelay = 1000; // Minimum 1 second
    const maxDelay = 5000 - (intensity * 30); // Max 5 seconds, reduced by intensity
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    
    console.log(`Scheduling next thunder in ${delay/1000} seconds`);
    
    // Set the timer to play thunder after the random delay
    thunderTimerRef.current = setTimeout(() => {
      if (thunderSoundRef.current && effects.thunder > 0 && isPlaying) {
        // Amplify thunder volume for better audibility
        const thunderVolume = (effects.thunder / 100) * 2.5;
        // Clamp to max 1.0
        const clampedThunderVolume = Math.min(thunderVolume, 1.0);
        thunderSoundRef.current.volume(clampedThunderVolume);
        
        console.log('Playing thunder at volume:', clampedThunderVolume);
        thunderSoundRef.current.play();
      }
    }, delay);
  };

  // Create echoes to simulate reverb trail
  const createEchoEffect = (reverbAmount) => {
    // Clear any existing echo timer/interval
    if (echoTimerRef.current) {
      clearTimeout(echoTimerRef.current);
      echoTimerRef.current = null;
    }
    
    if (echoIntervalRef.current) {
      clearInterval(echoIntervalRef.current);
      echoIntervalRef.current = null;
    }
    
    // Only create echo if reverb is enabled and song is playing
    if (reverbAmount > 0 && soundRef.current && isPlaying) {
      // Calculate echo parameters based on reverb amount
      const echoDelay = 200 + (reverbAmount * 2); // ms - longer delay for higher reverb
      const echoCount = Math.floor(2 + (reverbAmount / 20)); // more echoes for higher reverb
      const initialVolume = (reverbAmount / 100) * 0.4; // initial echo volume (max 0.4)
      
      let echoIndex = 0;
      
      // Create the interval for multiple echoes
      echoIntervalRef.current = setInterval(() => {
        // Stop after desired number of echoes or if song paused
        if (echoIndex >= echoCount || !isPlaying) {
          clearInterval(echoIntervalRef.current);
          echoIntervalRef.current = null;
          return;
        }
        
        // Calculate decreasing volume for each successive echo
        const echoVolume = initialVolume * (1 - (echoIndex / echoCount));
        
        try {
          // Create a new echo sound
          if (echoSoundRef.current) {
            echoSoundRef.current.unload();
          }
          
          // Get current position
          const currentPos = soundRef.current.seek();
          
          // Create echo with current audio
          echoSoundRef.current = new Howl({
            src: [song.url],
            html5: true,
            volume: echoVolume,
            rate: effects.speed * (0.98 - (echoIndex * 0.01)), // Slightly slower for trailing effect
            onload: () => {
              // Only play if song is still playing
              if (isPlaying) {
                // Set position to match main sound
                echoSoundRef.current.seek(currentPos);
                echoSoundRef.current.play();
              }
            }
          });
          
          echoIndex++;
        } catch (error) {
          console.error('Error creating echo:', error);
          clearInterval(echoIntervalRef.current);
          echoIntervalRef.current = null;
        }
      }, echoDelay);
      
      // Only schedule next batch of echoes if song is playing
      if (isPlaying) {
        const nextEchoTime = (echoDelay * echoCount) + 100;
        echoTimerRef.current = setTimeout(() => {
          if (soundRef.current && isPlaying && effects.reverb > 0) {
            createEchoEffect(effects.reverb);
          }
        }, nextEchoTime);
      }
    }
  };

  // Stop all sound effects
  const stopAllEffects = () => {
    // Stop rain sound
    if (rainSoundRef.current && rainSoundRef.current.playing()) {
      rainSoundRef.current.pause(); // Use pause instead of stop to retain position
    }
    
    // Stop thunder sound and clear timer
    if (thunderSoundRef.current && thunderSoundRef.current.playing()) {
      thunderSoundRef.current.stop();
    }
    
    if (thunderTimerRef.current) {
      clearTimeout(thunderTimerRef.current);
      thunderTimerRef.current = null;
    }
    
    // Stop echo/reverb effect and clear timers
    if (echoSoundRef.current && echoSoundRef.current.playing()) {
      echoSoundRef.current.stop();
    }
    
    if (echoTimerRef.current) {
      clearTimeout(echoTimerRef.current);
      echoTimerRef.current = null;
    }
    
    if (echoIntervalRef.current) {
      clearInterval(echoIntervalRef.current);
      echoIntervalRef.current = null;
    }
  };
  
  // Resume all sound effects
  const resumeAllEffects = () => {
    // Resume rain if needed
    if (rainSoundRef.current && effects.rain > 0) {
      const rainVolume = (effects.rain / 100) * 1.5;
      const clampedRainVolume = Math.min(rainVolume, 1.0);
      rainSoundRef.current.volume(clampedRainVolume);
      rainSoundRef.current.play();
    }
    
    // Schedule thunder if needed
    if (effects.thunder > 0 && !thunderTimerRef.current) {
      // Start with an immediate thunder
      const thunderVolume = (effects.thunder / 100) * 2.5;
      const clampedThunderVolume = Math.min(thunderVolume, 1.0);
      
      if (thunderSoundRef.current) {
        thunderSoundRef.current.volume(clampedThunderVolume);
        thunderSoundRef.current.play();
      }
    }
    
    // Restart reverb if needed
    if (effects.reverb > 0) {
      createEchoEffect(effects.reverb);
    }
  };

  // Initialize sound effects
  useEffect(() => {
    try {
      // Create the rain sound with looping enabled
      rainSoundRef.current = new Howl({
        src: [`${window.location.origin}/api/effects/rain.mp3`],
        loop: true,  // Enable looping
        volume: 0,
        html5: true,
        onloaderror: (id, error) => {
          console.error('Error loading rain sound:', error);
        }
      });
      
      // Create the thunder sound - NOT looping
      thunderSoundRef.current = new Howl({
        src: [`${window.location.origin}/api/effects/thunder.mp3`],
        loop: false,  // Disable looping - we'll handle timing manually
        volume: 0,
        html5: true,
        onloaderror: (id, error) => {
          console.error('Error loading thunder sound:', error);
        },
        onend: () => {
          // When thunder ends, schedule next thunder if effect is active
          if (effects.thunder > 0 && isPlaying) {
            scheduleNextThunder(effects.thunder);
          }
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
        if (echoSoundRef.current) {
          echoSoundRef.current.unload();
        }
        
        // Clear any pending timers
        if (thunderTimerRef.current) {
          clearTimeout(thunderTimerRef.current);
        }
        if (echoTimerRef.current) {
          clearTimeout(echoTimerRef.current);
        }
        if (echoIntervalRef.current) {
          clearInterval(echoIntervalRef.current);
        }
      } catch (error) {
        console.error('Error cleaning up sound effects:', error);
      }
    };
  }, []);
  
  // Watch isPlaying state to control effects
  useEffect(() => {
    if (isPlaying) {
      resumeAllEffects();
    } else {
      stopAllEffects();
    }
  }, [isPlaying]);
  
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
        
        if (echoSoundRef.current) {
          echoSoundRef.current.unload();
        }
        
        // Clear any pending echo timers
        if (echoTimerRef.current) {
          clearTimeout(echoTimerRef.current);
          echoTimerRef.current = null;
        }
        
        if (echoIntervalRef.current) {
          clearInterval(echoIntervalRef.current);
          echoIntervalRef.current = null;
        }
        
        // Create a new Howl for the current song
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
            
            // Stop any echo effects
            if (echoSoundRef.current) {
              echoSoundRef.current.stop();
            }
            
            if (echoTimerRef.current) {
              clearTimeout(echoTimerRef.current);
              echoTimerRef.current = null;
            }
            
            if (echoIntervalRef.current) {
              clearInterval(echoIntervalRef.current);
              echoIntervalRef.current = null;
            }
            
            // Also stop other effects since song ended
            stopAllEffects();
          },
          onplay: () => {
            console.log('Song playback started');
            
            // Effects will be started by the isPlaying effect
          },
          onpause: () => {
            console.log('Song playback paused');
            
            // Effects will be stopped by the isPlaying effect
          },
          onseek: () => {
            console.log('Song seek occurred');
            
            // Reset echo effects on seek
            if (echoSoundRef.current) {
              echoSoundRef.current.stop();
            }
            
            if (echoTimerRef.current) {
              clearTimeout(echoTimerRef.current);
              echoTimerRef.current = null;
            }
            
            if (echoIntervalRef.current) {
              clearInterval(echoIntervalRef.current);
              echoIntervalRef.current = null;
            }
            
            // Restart echo effect if playing and reverb is enabled
            if (isPlaying && effects.reverb > 0) {
              createEchoEffect(effects.reverb);
            }
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
  
  // Apply effects when they change
  useEffect(() => {
    if (!soundRef.current) return;
    
    try {
      // Apply speed effect
      soundRef.current.rate(effects.speed);
      
      // Update reverb effect when slider changes
      // Clear existing effect and recreate if needed
      if (echoTimerRef.current) {
        clearTimeout(echoTimerRef.current);
        echoTimerRef.current = null;
      }
      
      if (echoIntervalRef.current) {
        clearInterval(echoIntervalRef.current);
        echoIntervalRef.current = null;
      }
      
      // If song is playing and reverb is enabled, create new echoes
      if (isPlaying && effects.reverb > 0) {
        createEchoEffect(effects.reverb);
      }
      
      // Apply rain sound with amplification
      if (rainSoundRef.current) {
        // Amplify rain volume for better audibility
        const rainVolume = (effects.rain / 100) * 1.5; 
        // Clamp to max 1.0
        const clampedRainVolume = Math.min(rainVolume, 1.0);
        rainSoundRef.current.volume(clampedRainVolume);
        
        // Only play rain if song is playing
        if (rainVolume > 0 && isPlaying) {
          if (!rainSoundRef.current.playing()) {
            console.log('Starting rain sound with volume:', clampedRainVolume);
            rainSoundRef.current.play();
          }
        } else {
          if (rainSoundRef.current.playing()) {
            console.log('Stopping rain sound');
            rainSoundRef.current.stop();
          }
        }
      }
      
      // Apply thunder sound with random timing
      if (thunderSoundRef.current) {
        // Handle thunder effect changes
        if (effects.thunder > 0 && isPlaying) {
          // If we've just turned on thunder or increased it
          if (!thunderTimerRef.current) {
            // Start with an immediate thunder
            const thunderVolume = (effects.thunder / 100) * 2.5;
            const clampedThunderVolume = Math.min(thunderVolume, 1.0);
            thunderSoundRef.current.volume(clampedThunderVolume);
            
            console.log('Starting initial thunder with volume:', clampedThunderVolume);
            thunderSoundRef.current.play();
            
            // Next thunder will be scheduled by the onend handler
          }
        } else {
          // Thunder effect is turned off or song is paused
          if (thunderTimerRef.current) {
            clearTimeout(thunderTimerRef.current);
            thunderTimerRef.current = null;
          }
          if (thunderSoundRef.current.playing()) {
            thunderSoundRef.current.stop();
          }
        }
      }
    } catch (error) {
      console.error('Error applying effects:', error);
    }
  }, [effects, isPlaying]);
  
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
        setIsPlaying(false);
      } else {
        soundRef.current.play();
        animationRef.current = requestAnimationFrame(updateProgress);
        setIsPlaying(true);
      }
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