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
import { loadCardsFromSupabase } from './game/CardLoader';
import { Tutorial } from './components/Tutorial/Tutorial';
import { Login } from './components/Login/Login';
import { DeckManager } from './components/DeckManager/DeckManager';
import { MuteButton } from './components/MuteButton/MuteButton';
import { AuthUser, getCurrentUser, onAuthStateChange, signOut } from './supabase/auth';
import { musicService } from './services/MusicService';
import './App.css';

function App() {
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [cardsError, setCardsError] = useState<Error | null>(null);

  // Load cards from Supabase on mount
  useEffect(() => {
    loadCardsFromSupabase()
      .then(() => {
        setCardsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load cards:', error);
        setCardsError(error);
        // Still set loaded to true to allow app to continue (with fallback to local cards)
        setCardsLoaded(true);
      });
  }, []);
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerDeck, setPlayerDeck] = useState<PlayerDeck | null>(null);
  const [mulliganCards, setMulliganCards] = useState<string[]>([]);
  const [showMulligan, setShowMulligan] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [aiOpponent] = useState<AIOpponent>(new AIOpponent('AI Chef'));
  const [isMuted, setIsMuted] = useState(musicService.getMuted());
  // Current player ID - in single-player mode, always 'player1' (you are always at bottom)
  const currentPlayerId: 'player1' | 'player2' = 'player1';

  // Check auth state on mount
  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange(setUser);
    return () => unsubscribe();
  }, []);

  // Music management - play intro on lobby screen, gameplay music during game
  useEffect(() => {
    if (!gameState) {
      // On lobby screen - play intro music
      musicService.playIntro();
    } else if (gameState.phase === GamePhase.TURN || 
               gameState.phase === GamePhase.FACE_OFF || 
               gameState.phase === GamePhase.ROUND_START ||
               gameState.phase === GamePhase.ROUND_END) {
      // During gameplay - play random gameplay music
      musicService.playGameplayMusic();
    }
  }, [gameState]);

  const handleToggleMute = () => {
    const newMutedState = musicService.toggleMute();
    setIsMuted(newMutedState);
  };

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

    if (!playerDeck) {
      alert('Please build a deck first');
      return;
    }

    // Create a new game state
    const newGameState = createGameState('local-game');
    
    // Player 1 is always the human player (will be displayed at bottom)
    const humanPlayer = initializePlayer('player1', playerName, playerDeck);
    
    // Player 2 is always the AI opponent (will be displayed at top)
    const aiDeck = aiOpponent.createAIDeck();
    const aiPlayer = initializePlayer('player2', aiOpponent.getName(), aiDeck);

    // Update game state
    const updatedState = {
      ...newGameState,
      phase: GamePhase.MULLIGAN,
      players: {
        player1: humanPlayer,
        player2: aiPlayer
      }
    };

    setGameState(updatedState);
    setShowMulligan(true);
  };

  const handleDeckComplete = (completedDeck: PlayerDeck) => {
    setPlayerDeck(completedDeck);
    setShowDeckBuilder(false);
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

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const handleLoadDeck = (deck: PlayerDeck) => {
    setPlayerDeck(deck);
    setShowDeckManager(false);
    setShowDeckBuilder(false);
  };

  // Show loading screen while cards are loading
  if (!cardsLoaded) {
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        <div className="loading-screen">
          <h1>Chef Card Game</h1>
          <p>Loading cards...</p>
          {cardsError && (
            <p className="error-text">Warning: Failed to load cards from database. Using fallback.</p>
          )}
        </div>
      </div>
    );
  }

  // Show login screen if user wants to login (optional)
  if (showLogin) {
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        <Login
          onLogin={handleLogin}
          onSkip={() => setShowLogin(false)}
        />
      </div>
    );
  }

  // Show deck builder if user wants to build/edit deck
  if (showDeckBuilder) {
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        {showDeckManager && user && (
          <DeckManager
            currentDeck={playerDeck || undefined}
            onLoadDeck={handleLoadDeck}
            onClose={() => setShowDeckManager(false)}
          />
        )}
        <div className="deck-building-screen">
          <div className="deck-building-header">
            <h2>Build Your Deck</h2>
            <div className="deck-building-actions">
              {user && (
                <button onClick={() => setShowDeckManager(true)} className="deck-manager-button">
                  📚 My Decks
                </button>
              )}
              <button onClick={() => setShowDeckBuilder(false)} className="back-button">
                ← Back to Lobby
              </button>
            </div>
          </div>
          <DeckBuilder 
            onDeckComplete={handleDeckComplete}
            initialDeck={playerDeck || undefined}
          />
        </div>
      </div>
    );
  }

  // Initial screen - enter name and start
  if (!gameState) {
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
        {showDeckManager && user && (
          <DeckManager
            currentDeck={playerDeck || undefined}
            onLoadDeck={handleLoadDeck}
            onClose={() => setShowDeckManager(false)}
          />
        )}
        <div className="lobby-screen">
          <div className="lobby-header">
            <h1>Chef Card Game</h1>
            <div className="lobby-user-actions">
              {user ? (
                <>
                  <span className="user-info">Welcome, {user.name || user.email}!</span>
                  <button onClick={() => setShowDeckManager(true)} className="deck-manager-button">
                    📚 My Decks
                  </button>
                  <button onClick={handleLogout} className="logout-button">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLogin(true)} className="login-button-header">
                  Sign In / Sign Up
                </button>
              )}
            </div>
          </div>
          <div className="lobby-form">
            <div className="game-mode-badge">
              <span className="badge-icon">🤖</span>
              <span className="badge-text">AI Opponent Mode</span>
            </div>
            <h2>Play Against AI</h2>
            <p className="lobby-description">Build your deck and compete against an AI opponent!</p>
            <div className="lobby-buttons-top">
              <button onClick={() => setShowTutorial(true)} className="tutorial-button-link">
                📖 How to Play
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
              onKeyPress={(e) => e.key === 'Enter' && playerDeck && handleStartGame()}
            />
            <div className="lobby-actions">
              <button 
                onClick={() => setShowDeckBuilder(true)} 
                className="lobby-button"
              >
                🎴 Build Deck
              </button>
              <button 
                onClick={handleStartGame} 
                className="lobby-button ai-button" 
                disabled={!playerName.trim() || !playerDeck}
              >
                🤖 Start Game vs AI
              </button>
            </div>
            {!playerName.trim() && (
              <p className="hint-text">Please enter your name to start</p>
            )}
            {!playerDeck && (
              <p className="hint-text">Please build a deck before starting the game</p>
            )}
            {playerDeck && (
              <div className="deck-status">
                <p className="deck-status-text">✓ Deck ready ({playerDeck.mainDeck.length} cards)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Mulligan phase
  if (gameState.phase === GamePhase.MULLIGAN && showMulligan) {
    const player1 = gameState.players.player1;
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
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
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
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
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
        <GameBoard
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onCardPlay={handleCardPlay}
          onEndTurn={handleEndTurn}
          onNextRound={handleNextRound}
          onShowTutorial={() => setShowTutorial(true)}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
      <div className="waiting-screen">
        <h2>Waiting for game to start...</h2>
        <p>Phase: {gameState.phase}</p>
      </div>
    </div>
  );
}

export default App;
