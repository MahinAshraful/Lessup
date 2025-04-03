import React from 'react';

const EffectsPanel = ({ effects, onEffectChange }) => {
  const handleSliderChange = (effect, event) => {
    const value = parseFloat(event.target.value);
    onEffectChange(effect, value);
  };
  
  return (
    <div className="effects-panel">
      <div className="effect-control">
        <h3>Speed</h3>
        <input 
          type="range" 
          min="0.5" 
          max="1.5" 
          step="0.01" 
          value={effects.speed} 
          onChange={(e) => handleSliderChange('speed', e)} 
          className="effect-slider"
        />
        <span className="effect-value">{effects.speed.toFixed(2)}x</span>
      </div>
      
      <div className="effect-control">
        <h3>Reverb</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={effects.reverb} 
          onChange={(e) => handleSliderChange('reverb', e)} 
          className="effect-slider"
        />
        <span className="effect-value">{effects.reverb}%</span>
      </div>
      
      <div className="effect-control">
        <h3>Rain</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={effects.rain} 
          onChange={(e) => handleSliderChange('rain', e)} 
          className="effect-slider"
        />
        <span className="effect-value">{effects.rain}%</span>
      </div>
      
      <div className="effect-control">
        <h3>Thunder</h3>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={effects.thunder} 
          onChange={(e) => handleSliderChange('thunder', e)} 
          className="effect-slider"
        />
        <span className="effect-value">{effects.thunder}%</span>
      </div>
    </div>
  );
};

export default EffectsPanel;