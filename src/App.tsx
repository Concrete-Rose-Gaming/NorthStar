import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard/GameBoard';
import { DeckBuilder } from './components/DeckBuilder/DeckBuilder';
import { useGameState } from './hooks/useGameState';
import {
  GameState,
  GamePhase,
  createGameState,
  initializePlayer,
  performMulligan,
  flipCoin,
  setFirstPlayer,
  startRound,
  playCard,
  completeTurn,
  bothPlayersReady,
  performFaceOff,
  advanceToNextRound,
  resetTurnStatus
} from './game/GameEngine';
import { Deck } from './game/DeckManager';
import { createGameRoom } from './supabase/config';
import './App.css';

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<'player1' | 'player2' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [mulliganCards, setMulliganCards] = useState<string[]>([]);
  const [showMulligan, setShowMulligan] = useState(false);
  const [joiningGameId, setJoiningGameId] = useState('');

  const { gameState, loading, updateState, updatePlayer, createGame } = useGameState(gameId);

  // Initialize player ID on mount
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
      setPlayerId(storedPlayerId as 'player1' | 'player2');
    } else {
      const newPlayerId = Math.random() < 0.5 ? 'player1' : 'player2';
      setPlayerId(newPlayerId);
      localStorage.setItem('playerId', newPlayerId);
    }
  }, []);

  const handleFaceOff = useCallback(async () => {
    if (!gameId || !gameState) return;

    const updatedState = performFaceOff(gameState);
    await updateState(updatedState);
  }, [gameId, gameState, updateState]);

  // Handle game state changes
  useEffect(() => {
    if (!gameState || !playerId || !gameId) return;

    // Auto-advance phases
    if (gameState.phase === GamePhase.TURN && bothPlayersReady(gameState)) {
      // Both players ready, trigger face-off
      handleFaceOff();
    }
  }, [gameState, playerId, gameId, handleFaceOff]);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      const newGameId = await createGame();
      const initialState = createGameState(newGameId);
      await createGameRoom(newGameId, initialState);
      setGameId(newGameId);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please check Firebase configuration.');
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!joiningGameId.trim()) {
      alert('Please enter a game ID');
      return;
    }

    setGameId(joiningGameId);
  };

  const handleDeckComplete = async (completedDeck: Deck) => {
    if (!gameId || !playerId) return;

    setDeck(completedDeck);
    const player = initializePlayer(playerId, playerName, completedDeck);
    await updatePlayer(playerId, player);
    
    // Check if both players are ready
    const currentState = gameState;
    if (currentState) {
      const otherPlayerId = playerId === 'player1' ? 'player2' : 'player1';
      const otherPlayer = currentState.players[otherPlayerId];
      
      if (otherPlayer?.ready) {
        // Both players ready, move to mulligan phase
        await updateState({ phase: GamePhase.MULLIGAN });
      } else {
        // Mark this player as ready
        await updatePlayer(playerId, { ...player, ready: true });
      }
    }
  };

  const handleMulligan = async () => {
    if (!gameId || !playerId || !deck || mulliganCards.length === 0) return;

    const currentPlayer = gameState?.players[playerId];
    if (!currentPlayer) return;

    const updatedPlayer = performMulligan(currentPlayer, mulliganCards);
    await updatePlayer(playerId, updatedPlayer);
    setMulliganCards([]);
    setShowMulligan(false);

    // Mark mulligan complete
    await updatePlayer(playerId, { ...updatedPlayer, ready: true });

    // Check if both players done with mulligan
    const currentState = gameState;
    if (currentState) {
      const otherPlayerId = playerId === 'player1' ? 'player2' : 'player1';
      const otherPlayer = currentState.players[otherPlayerId];
      
      if (otherPlayer?.ready) {
        // Both ready, move to coin flip
        const coinResult = flipCoin();
        await updateState(setFirstPlayer(currentState, coinResult));
      }
    }
  };

  const handleSkipMulligan = async () => {
    if (!gameId || !playerId) return;

    const currentPlayer = gameState?.players[playerId];
    if (!currentPlayer) return;

    await updatePlayer(playerId, { ...currentPlayer, ready: true });

    // Check if both players done
    const currentState = gameState;
    if (currentState) {
      const otherPlayerId = playerId === 'player1' ? 'player2' : 'player1';
      const otherPlayer = currentState.players[otherPlayerId];
      
      if (otherPlayer?.ready) {
        const coinResult = flipCoin();
        await updateState(setFirstPlayer(currentState, coinResult));
      }
    }
  };

  const handleCardPlay = async (cardId: string) => {
    if (!gameId || !playerId || !gameState) return;

    const currentPlayer = gameState.players[playerId];
    if (!currentPlayer || currentPlayer.turnComplete) return;

    const updatedPlayer = playCard(currentPlayer, cardId);
    await updatePlayer(playerId, updatedPlayer);
  };

  const handleEndTurn = async () => {
    if (!gameId || !playerId || !gameState) return;

    const currentPlayer = gameState.players[playerId];
    if (!currentPlayer) return;

    const updatedPlayer = completeTurn(currentPlayer);
    await updatePlayer(playerId, updatedPlayer);
  };

  const handleNextRound = async () => {
    if (!gameId || !gameState) return;

    const resetState = resetTurnStatus(gameState);
    const newState = advanceToNextRound(resetState);
    await updateState(newState);
  };

  // Render based on game phase
  if (!gameId) {
    return (
      <div className="App">
        <div className="lobby-screen">
          <h1>Chef Card Game</h1>
          <div className="lobby-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            <div className="lobby-actions">
              <button onClick={handleCreateGame} className="lobby-button">
                Create New Game
              </button>
              <div className="join-section">
                <input
                  type="text"
                  placeholder="Enter Game ID"
                  value={joiningGameId}
                  onChange={(e) => setJoiningGameId(e.target.value)}
                  className="game-id-input"
                />
                <button onClick={handleJoinGame} className="lobby-button">
                  Join Game
                </button>
              </div>
            </div>
            {gameId && (
              <div className="game-id-display">
                <p>Game ID: <strong>{gameId}</strong></p>
                <p>Share this ID with your opponent!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>Loading game...</h2>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="App">
        <div className="error-screen">
          <h2>Game not found</h2>
          <button onClick={() => setGameId(null)}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  // Deck building phase
  if (gameState.phase === GamePhase.LOBBY || gameState.phase === GamePhase.DECK_BUILDING) {
    const currentPlayer = gameState.players[playerId!];
    if (!currentPlayer || !currentPlayer.deck || currentPlayer.deck.length === 0) {
      return (
        <div className="App">
          <div className="deck-building-screen">
            <h2>Build Your Deck</h2>
            <DeckBuilder onDeckComplete={handleDeckComplete} />
          </div>
        </div>
      );
    }
  }

  // Mulligan phase
  if (gameState.phase === GamePhase.MULLIGAN && !showMulligan) {
    const currentPlayer = gameState.players[playerId!];
    if (currentPlayer && !currentPlayer.ready) {
      setShowMulligan(true);
    }
  }

  if (showMulligan && gameState.phase === GamePhase.MULLIGAN) {
    const currentPlayer = gameState.players[playerId!];
    return (
      <div className="App">
        <div className="mulligan-screen">
          <h2>Mulligan Phase</h2>
          <p>Select cards to mulligan (or skip)</p>
          <div className="mulligan-hand">
            {currentPlayer?.hand.map(cardId => (
              <button
                key={cardId}
                className={`mulligan-card ${mulliganCards.includes(cardId) ? 'selected' : ''}`}
                onClick={() => {
                  if (mulliganCards.includes(cardId)) {
                    setMulliganCards(mulliganCards.filter(id => id !== cardId));
                  } else {
                    setMulliganCards([...mulliganCards, cardId]);
                  }
                }}
              >
                {cardId}
              </button>
            ))}
          </div>
          <div className="mulligan-actions">
            <button onClick={handleMulligan} disabled={mulliganCards.length === 0}>
              Mulligan Selected ({mulliganCards.length})
            </button>
            <button onClick={handleSkipMulligan}>Skip Mulligan</button>
          </div>
        </div>
      </div>
    );
  }

  // Coin flip phase
  if (gameState.phase === GamePhase.COIN_FLIP) {
    return (
      <div className="App">
        <div className="coin-flip-screen">
          <h2>Flipping Coin...</h2>
          {gameState.coinFlipResult && (
            <div className="coin-result">
              <p>Result: {gameState.coinFlipResult}</p>
              <p>First Player: {gameState.firstPlayer}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main game phases
  if (
    gameState.phase === GamePhase.ROUND_START ||
    gameState.phase === GamePhase.TURN ||
    gameState.phase === GamePhase.FACE_OFF ||
    gameState.phase === GamePhase.ROUND_END ||
    gameState.phase === GamePhase.GAME_END
  ) {
    // Start round if needed
    if (gameState.phase === GamePhase.ROUND_START) {
      const newState = startRound(gameState);
      updateState(newState);
    }

    return (
      <div className="App">
        <GameBoard
          gameState={gameState}
          currentPlayerId={playerId!}
          onCardPlay={handleCardPlay}
          onEndTurn={handleEndTurn}
          onNextRound={handleNextRound}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <div className="waiting-screen">
        <h2>Waiting for game to start...</h2>
        <p>Phase: {gameState.phase}</p>
      </div>
    </div>
  );
}

export default App;
