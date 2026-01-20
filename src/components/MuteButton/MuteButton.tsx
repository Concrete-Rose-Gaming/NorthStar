import React from 'react';
import './MuteButton.css';

interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const MuteButton: React.FC<MuteButtonProps> = ({ isMuted, onToggle }) => {
  return (
    <button 
      className="mute-button" 
      onClick={onToggle}
      title={isMuted ? 'Unmute Music' : 'Mute Music'}
      aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
};
