import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import { useGameStore } from './store/gameStore';

const SERVER_URL_KEY = 'culinary-game-server-url';

function App() {
  const { currentGameId } = useGameStore();
  const [username, setUsername] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [showServerInput, setShowServerInput] = useState(true);

  // Load saved server URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(SERVER_URL_KEY);
    if (savedUrl) {
      setServerUrl(savedUrl);
      setShowServerInput(false);
    }
  }, []);

  // Save server URL when changed
  const handleServerUrlSubmit = () => {
    const url = serverUrl.trim();
    if (url) {
      // Ensure URL has protocol
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      localStorage.setItem(SERVER_URL_KEY, urlWithProtocol);
      setServerUrl(urlWithProtocol);
      setShowServerInput(false);
    }
  };

  // Server URL input screen
  if (showServerInput) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <h1>Culinary Card Game</h1>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <p style={{ marginBottom: '20px', color: '#aaa' }}>
            Enter the game server URL (Cloudflare tunnel URL)
          </p>
          <input
            type="text"
            placeholder="https://xxxx-xxxx-xxxx.trycloudflare.com"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleServerUrlSubmit();
              }
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '2px solid #4CAF50',
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#2a2a3e',
              color: '#eee'
            }}
          />
          <button
            onClick={handleServerUrlSubmit}
            style={{
              padding: '10px 30px',
              fontSize: '16px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              marginTop: '10px',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            Connect
          </button>
          {localStorage.getItem(SERVER_URL_KEY) && (
            <button
              onClick={() => {
                localStorage.removeItem(SERVER_URL_KEY);
                setServerUrl('');
              }}
              style={{
                padding: '8px 20px',
                fontSize: '14px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#666',
                color: 'white',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Change Server URL
            </button>
          )}
        </div>
      </div>
    );
  }

  // Username input screen
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
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}>
            Server: {serverUrl}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem(SERVER_URL_KEY);
              setShowServerInput(true);
              setServerUrl('');
            }}
            style={{
              padding: '5px 15px',
              fontSize: '12px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#666',
              color: 'white',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Change Server
          </button>
        </div>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => {
            const newValue = e.target.value;
            setUsername(newValue);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && username.trim()) {
              const trimmed = username.trim();
              setUsername(trimmed);
            }
          }}
          autoFocus
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#2a2a3e',
            color: '#eee'
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

