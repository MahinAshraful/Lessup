// src/components/SongUploader.jsx
import React, { useState } from 'react';

const SongUploader = ({ onUpload, isLoading }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (limit to 15MB)
      if (selectedFile.size > 15 * 1024 * 1024) {
        setError('File size too large (max 15MB)');
        return;
      }
      
      // Check file type
      const fileType = selectedFile.type;
      if (!fileType.startsWith('audio/')) {
        setError('Only audio files are allowed');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      console.log('Selected file:', selectedFile.name, 'Type:', fileType);
      
      // Try to extract title and artist from filename if they're empty
      if (!title && !artist) {
        const nameParts = selectedFile.name.replace(/\.[^/.]+$/, "").split(" - ");
        if (nameParts.length > 1) {
          setArtist(nameParts[0]);
          setTitle(nameParts[1]);
        } else {
          setTitle(nameParts[0]);
        }
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!file) {
      setError('Please select an audio file');
      return;
    }
    
    if (!title) {
      setError('Please enter a title');
      return;
    }
    
    try {
      console.log('Submitting file:', file.name, 'Title:', title, 'Artist:', artist);
      await onUpload(file, title, artist);
      
      // Reset form
      setFile(null);
      setFileName('');
      setTitle('');
      setArtist('');
      console.log('Upload completed successfully');
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  return (
    <div className="song-uploader">
      <h2>Upload Song</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="artist">Artist</label>
          <input 
            type="text" 
            id="artist" 
            value={artist} 
            onChange={(e) => setArtist(e.target.value)} 
          />
        </div>
        
        <div className="form-group file-input">
          <label htmlFor="song-file">
            {fileName || 'Choose audio file (.mp3, .wav, .ogg)'}
          </label>
          <input 
            type="file" 
            id="song-file" 
            accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg" 
            onChange={handleFileChange} 
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="upload-btn" 
          disabled={!file || isLoading}
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default SongUploader;