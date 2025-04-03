const API_URL = 'https://lessup-backend.onrender.com/api';
export const fetchSongs = async () => {
  try {
    console.log('Fetching songs from:', `${API_URL}/songs`);
    const response = await fetch(`${API_URL}/songs`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Fetched songs:', data);
    return data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

export const uploadSong = async (file, title, artist) => {
  try {
    console.log('Uploading song to:', `${API_URL}/upload`);
    console.log('File details:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist || 'Unknown Artist');
    
    // Log FormData content (for debugging)
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type header - the browser will set it with the correct boundary
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to upload song: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If response is not JSON, try to get text
        const errorText = await response.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Upload successful:', data);
    return data;
  } catch (error) {
    console.error('Error uploading song:', error);
    throw error;
  }
};