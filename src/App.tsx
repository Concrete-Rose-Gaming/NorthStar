import React, { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard/GameBoard';
import { DeckBuilder } from './components/DeckBuilder/DeckBuilder';
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
  performFaceOff,
  advanceToNextRound,
  resetTurnStatus
} from './game/GameEngine';
import { PlayerDeck } from './game/DeckManager';
import { AIOpponent } from './game/AIOpponent';
import { getCardById, CardType } from './game/CardTypes';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerDeck, setPlayerDeck] = useState<PlayerDeck | null>(null);
  const [mulliganCards, setMulliganCards] = useState<string[]>([]);
  const [showMulligan, setShowMulligan] = useState(false);
  const [aiOpponent] = useState<AIOpponent>(new AIOpponent('AI Chef'));
  // Current player ID - in single-player mode, always 'player1' (you are always at bottom)
  const currentPlayerId: 'player1' | 'player2' = 'player1';

  // Handle AI turn automatically
  useEffect(() => {
    if (!gameState || gameState.phase !== GamePhase.TURN) return;

    const player1 = gameState.players.player1;
    const player2 = gameState.players.player2;

    // If it's player2's (AI) turn and they haven't completed it
    if (player2 && !player2.turnComplete && player1?.turnComplete) {
      // AI takes its turn after a short delay
      const timer = setTimeout(() => {
        const aiPlayer = aiOpponent.executeTurn(player2, player1);
        const updatedState = {
          ...gameState,
          players: {
            ...gameState.players,
            player2: aiPlayer
          }
        };
        setGameState(updatedState);
      }, 1000); // 1 second delay for AI "thinking"

      return () => clearTimeout(timer);
    }

    // If both players are done, trigger face-off
    if (player1?.turnComplete && player2?.turnComplete) {
      const timer = setTimeout(() => {
        const faceOffState = performFaceOff(gameState);
        setGameState(faceOffState);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState, aiOpponent]);

  const handleStartGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Create a new game state
    const newGameState = createGameState('local-game');
    setGameState(newGameState);
  };

  const handleDeckComplete = (completedDeck: PlayerDeck) => {
    if (!gameState) return;

    setPlayerDeck(completedDeck);
    
    // Player 1 is always the human player (will be displayed at bottom)
    const humanPlayer = initializePlayer('player1', playerName, completedDeck);
    
    // Player 2 is always the AI opponent (will be displayed at top)
    const aiDeck = aiOpponent.createAIDeck();
    const aiPlayer = initializePlayer('player2', aiOpponent.getName(), aiDeck);

    // Update game state
    const updatedState = {
      ...gameState,
      phase: GamePhase.MULLIGAN,
      players: {
        player1: humanPlayer,
        player2: aiPlayer
      }
    };

    setGameState(updatedState);
    setShowMulligan(true);
  };

  const handleMulligan = () => {
    if (!gameState || mulliganCards.length === 0) return;

    const player1 = gameState.players.player1;
    if (!player1) return;

    // Human player mulligan
    const updatedPlayer1 = performMulligan(player1, mulliganCards);
    
    // AI mulligan (automatic)
    const player2 = gameState.players.player2;
    if (!player2) return;
    
    const aiMulliganCards = aiOpponent.decideMulligan(player2);
    const updatedPlayer2 = aiMulliganCards.length > 0 
      ? performMulligan(player2, aiMulliganCards)
      : { ...player2, ready: true };

    setMulliganCards([]);
    setShowMulligan(false);

    // Move to coin flip
    const coinResult = flipCoin();
    const updatedState = setFirstPlayer({
      ...gameState,
      players: {
        player1: { ...updatedPlayer1, ready: true },
        player2: updatedPlayer2
      }
    }, coinResult);

    setGameState(updatedState);
  };

  const handleSkipMulligan = () => {
    if (!gameState) return;

    const player1 = gameState.players.player1;
    const player2 = gameState.players.player2;
    if (!player1 || !player2) return;

    // AI mulligan (automatic)
    const aiMulliganCards = aiOpponent.decideMulligan(player2);
    const updatedPlayer2 = aiMulliganCards.length > 0 
      ? performMulligan(player2, aiMulliganCards)
      : { ...player2, ready: true };

    // Move to coin flip
    const coinResult = flipCoin();
    const updatedState = setFirstPlayer({
      ...gameState,
      players: {
        player1: { ...player1, ready: true },
        player2: updatedPlayer2
      }
    }, coinResult);

    setGameState(updatedState);
    setShowMulligan(false);
  };

  const handleCardPlay = (cardId: string) => {
    if (!gameState) return;

    const player1 = gameState.players.player1;
    if (!player1 || player1.turnComplete) return;

    const card = getCardById(cardId);
    if (!card) return;

    let targetType: 'meal' | 'staff' | 'support' | 'event' | undefined;
    if (card.type === CardType.MEAL) targetType = 'meal';
    else if (card.type === CardType.STAFF) targetType = 'staff';
    else if (card.type === CardType.SUPPORT) targetType = 'support';
    else if (card.type === CardType.EVENT) targetType = 'event';

    const updatedPlayer1 = playCard(player1, cardId, targetType);
    
    setGameState({
      ...gameState,
      players: {
        ...gameState.players,
        player1: updatedPlayer1
      }
    });
  };

  const handleEndTurn = () => {
    if (!gameState) return;

    const player1 = gameState.players.player1;
    if (!player1) return;

    const updatedPlayer1 = completeTurn(player1);
    
    setGameState({
      ...gameState,
      players: {
        ...gameState.players,
        player1: updatedPlayer1
      }
    });
  };

  const handleNextRound = () => {
    if (!gameState) return;

    const resetState = resetTurnStatus(gameState);
    const newState = advanceToNextRound(resetState);
    setGameState(newState);
  };

  // Initial screen - enter name and start
  if (!gameState) {
    return (
      <div className="App">
        <div className="lobby-screen">
          <h1>Chef Card Game</h1>
          <div className="lobby-form">
            <div className="game-mode-badge">
              <span className="badge-icon">🤖</span>
              <span className="badge-text">AI Opponent Mode</span>
            </div>
            <h2>Play Against AI</h2>
            <p className="lobby-description">Build your deck and compete against an AI opponent!</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
              onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
            />
            <div className="lobby-actions">
              <button onClick={handleStartGame} className="lobby-button ai-button" disabled={!playerName.trim()}>
                🤖 Start Game vs AI
              </button>
            </div>
            {!playerName.trim() && (
              <p className="hint-text">Please enter your name to start</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Deck building phase
  if (gameState.phase === GamePhase.LOBBY || gameState.phase === GamePhase.DECK_BUILDING) {
    const player1 = gameState.players.player1;
    if (!player1 || !player1.deck || player1.deck.length === 0) {
      return (
        <div className="App">
          <div className="deck-building-screen">
            <h2>Build Your Deck</h2>
            <DeckBuilder 
              onDeckComplete={handleDeckComplete}
              initialDeck={playerDeck || undefined}
            />
          </div>
        </div>
      );
    }
  }

  // Mulligan phase
  if (gameState.phase === GamePhase.MULLIGAN && showMulligan) {
    const player1 = gameState.players.player1;
    return (
      <div className="App">
        <div className="mulligan-screen">
          <h2>Mulligan Phase</h2>
          <p>Select cards to mulligan (or skip)</p>
          <div className="mulligan-hand">
            {player1?.hand.map(cardId => {
              const card = getCardById(cardId);
              return (
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
                  {card?.name || cardId}
                </button>
              );
            })}
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
              <p>First Player: {gameState.firstPlayer === 'player1' ? playerName : aiOpponent.getName()}</p>
              <button onClick={() => {
                const newState = startRound(gameState);
                setGameState(newState);
              }}>Start First Round</button>
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
      setGameState(newState);
    }

    return (
      <div className="App">
        <GameBoard
          gameState={gameState}
          currentPlayerId={currentPlayerId}
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
