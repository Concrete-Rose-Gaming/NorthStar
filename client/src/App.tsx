import { useState } from 'react';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import { useGameStore } from './store/gameStore';

function App() {
  const { currentGameId } = useGameStore();
  const [username, setUsername] = useState('');

  if (!username) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>Culinary Card Game</h1>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && username.trim()) {
              setUsername(username.trim());
            }
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none'
          }}
        />
        <button
          onClick={() => {
            if (username.trim()) {
              setUsername(username.trim());
            }
          }}
          style={{
            padding: '10px 30px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Enter
        </button>
      </div>
    );
  }

  return (
    <div>
      {currentGameId ? (
        <GameBoard username={username} />
      ) : (
        <Lobby username={username} />
      )}
    </div>
  );
}

export default App;

