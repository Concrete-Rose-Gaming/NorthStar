import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import Chat from './Chat';
import './Lobby.css';

interface LobbyProps {
  username: string;
}

function Lobby({ username }: LobbyProps) {
  const { playerList, pendingChallenges } = useGameStore();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('culinary-game-server-url') || '');

  useEffect(() => {
    socketService.connect(username);
    
    return () => {
      // Don't disconnect on unmount, keep connection for game
    };
  }, [username]);

  const handleChangeServer = () => {
    const url = serverUrl.trim();
    if (url) {
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      localStorage.setItem('culinary-game-server-url', urlWithProtocol);
      setShowServerSettings(false);
      // Reload to reconnect with new URL
      window.location.reload();
    }
  };

  const handleChallenge = (targetId: string) => {
    socketService.challengePlayer(targetId);
  };

  const handleAcceptChallenge = (challengeId: string) => {
    socketService.acceptChallenge(challengeId);
  };

  const handleRejectChallenge = (challengeId: string) => {
    socketService.rejectChallenge(challengeId);
  };

  const handleCreateAIGame = () => {
    socketService.createAIGame(difficulty);
  };

  const otherPlayers = playerList.filter(p => p.id !== socketService.getSocket()?.id && !p.isInGame);
  const myChallenges = pendingChallenges.filter(c => c.challengerId === socketService.getSocket()?.id);
  const receivedChallenges = pendingChallenges.filter(c => c.targetId === socketService.getSocket()?.id);

  return (
    <div className="lobby">
      <div className="lobby-main">
        <h1>Culinary Card Game - Lobby</h1>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#aaa' }}>
          Server: {localStorage.getItem('culinary-game-server-url') || 'Not set'}
          <button 
            onClick={() => setShowServerSettings(!showServerSettings)}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              fontSize: '11px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: '#555',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {showServerSettings ? 'Cancel' : 'Change'}
          </button>
        </div>
        {showServerSettings && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#2a2a3e',
            borderRadius: '5px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="https://xxxx-xxxx-xxxx.trycloudflare.com"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleChangeServer();
                }
              }}
              style={{
                flex: 1,
                padding: '8px 15px',
                fontSize: '14px',
                borderRadius: '5px',
                border: '2px solid #4CAF50',
                backgroundColor: '#1a1a2e',
                color: '#eee'
              }}
            />
            <button
              onClick={handleChangeServer}
              style={{
                padding: '8px 20px',
                fontSize: '14px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Update
            </button>
          </div>
        )}
        <div className="lobby-content">
          <div className="player-section">
            <h2>Players Online ({playerList.length})</h2>
            <div className="player-list">
              {otherPlayers.length === 0 ? (
                <p>No other players online</p>
              ) : (
                otherPlayers.map(player => (
                  <div key={player.id} className="player-item">
                    <span>{player.username}</span>
                    <button onClick={() => handleChallenge(player.id)}>Challenge</button>
                  </div>
                ))
              )}
            </div>

            <div className="ai-game-section">
              <h2>Play vs AI</h2>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button onClick={handleCreateAIGame}>Start AI Game</button>
            </div>

            {receivedChallenges.length > 0 && (
              <div className="challenges-section">
                <h2>Challenges Received</h2>
                {receivedChallenges.map(challenge => (
                  <div key={challenge.id} className="challenge-item">
                    <span>{challenge.challengerName} challenged you!</span>
                    <div>
                      <button onClick={() => handleAcceptChallenge(challenge.id)}>Accept</button>
                      <button onClick={() => handleRejectChallenge(challenge.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {myChallenges.length > 0 && (
              <div className="challenges-section">
                <h2>Pending Challenges</h2>
                {myChallenges.map(challenge => (
                  <div key={challenge.id} className="challenge-item">
                    <span>Waiting for {challenge.targetName} to respond...</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Chat username={username} />
        </div>
      </div>
    </div>
  );
}

export default Lobby;

