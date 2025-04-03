// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import MusicPlayer from './components/MusicPlayer';
import EffectsPanel from './components/EffectsPanel';
import Header from './components/Header';
import SongUploader from './components/SongUploader';
import { fetchSongs, uploadSong } from './services/api';

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [effects, setEffects] = useState({
    speed: 1.0,
    reverb: 0,
    rain: 0,
    thunder: 0
  });
  
  // Get songs from backend on component mount
  useEffect(() => {
    const getSongs = async () => {
      setIsLoading(true);
      setError('');
      try {
        console.log('Fetching songs from backend');
        const songList = await fetchSongs();
        setSongs(songList);
        if (songList.length > 0) {
          setCurrentSong(songList[0]);
          console.log('Loaded first song:', songList[0]);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
        setError('Failed to load songs. Make sure the backend server is running at http://127.0.0.1:5000');
      } finally {
        setIsLoading(false);
      }
    };
    
    getSongs();
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Clear errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleEffectChange = (effect, value) => {
    setEffects(prev => ({
      ...prev,
      [effect]: value
    }));
  };

  const handleUpload = async (file, title, artist) => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Uploading file: ${file.name} (${file.type})`);
      const newSong = await uploadSong(file, title, artist);
      console.log('Upload successful, new song:', newSong);
      
      setSongs(prev => [...prev, newSong]);
      setCurrentSong(newSong);
      setNotification(`Successfully uploaded "${title}" by ${artist || 'Unknown Artist'}`);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(`Upload failed: ${error.message || 'Unknown error. Make sure the backend server is running.'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="app-container">
      <Header />
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {notification && (
        <div className="notification-banner">
          <p>{notification}</p>
          <button onClick={() => setNotification('')}>×</button>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-indicator">
          <p>Loading...</p>
        </div>
      )}
      
      <div className="main-content">
        <div className="music-section">
          <MusicPlayer 
            song={currentSong} 
            effects={effects}
          />
          <SongUploader onUpload={handleUpload} isLoading={isLoading} />
        </div>
        <EffectsPanel 
          effects={effects} 
          onEffectChange={handleEffectChange} 
        />
      </div>
    </div>
  );
}

export default App;