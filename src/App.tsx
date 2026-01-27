import React, { useState, useEffect, useRef } from 'react';
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
  canAffordCard,
  completeTurn,
  removeCardFromPlay,
  reorderPlayedCard,
  performFaceOff,
  advanceToNextRound,
  resetTurnStatus,
  selectRestaurantFromDeck,
  revealRestaurants,
  revealNextCardPair
} from './game/GameEngine';
import { PlayerDeck, createPracticeDeck } from './game/DeckManager';
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
        // Only log actual errors, not expected "not configured" scenarios
        const isNotConfigured = error?.message === 'Supabase not configured';
        if (!isNotConfigured) {
          console.error('Failed to load cards:', error);
        }
        // Only set error state for actual errors, not configuration issues
        if (!isNotConfigured) {
          setCardsError(error);
        }
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [aiOpponent] = useState<AIOpponent>(new AIOpponent('AI Chef'));
  const [isMuted, setIsMuted] = useState(musicService.getMuted());
  type MusicContext = 'lobby' | 'mulligan' | 'gameplay' | 'other';
  const lastMusicContextRef = useRef<MusicContext | null>(null);
  // Current player ID - in single-player mode, always 'player1' (you are always at bottom)
  const currentPlayerId: 'player1' | 'player2' = 'player1';

  // Check auth state on mount
  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange(setUser);
    return () => unsubscribe();
  }, []);

  // Unlock audio on first user interaction (browsers block autoplay until then)
  useEffect(() => {
    const unlock = () => {
      musicService.playIntro();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // Music: intro (main/deck/login), mulligan (the show intro), gameplay (cooking-159122)
  useEffect(() => {
    const gameplayPhases = [GamePhase.TURN, GamePhase.FACE_OFF, GamePhase.ROUND_START, GamePhase.ROUND_END];
    const context: MusicContext =
      !gameState || showDeckBuilder || showLogin || showDeckManager
        ? 'lobby'
        : gameState.phase === GamePhase.MULLIGAN
          ? 'mulligan'
          : gameplayPhases.includes(gameState.phase)
            ? 'gameplay'
            : 'other';
    const prev = lastMusicContextRef.current;
    if (!musicService.getMuted()) {
      if (context === 'lobby' && prev !== 'lobby') musicService.playIntro();
      else if (context === 'mulligan' && prev !== 'mulligan') musicService.playMulliganMusic();
      else if (context === 'gameplay' && prev !== 'gameplay') musicService.playGameplayMusic();
    }
    lastMusicContextRef.current = context;
  }, [gameState, showDeckBuilder, showLogin, showDeckManager]);

  const handleToggleMute = () => {
    const newMutedState = musicService.toggleMute();
    setIsMuted(newMutedState);
  };

  // Handle restaurant selection phase - AI automatically selects
  useEffect(() => {
    if (!gameState || gameState.phase !== GamePhase.RESTAURANT_SELECTION) return;
    
    const player1 = gameState.players.player1;
    const player2 = gameState.players.player2;
    
    // If human player hasn't selected yet, wait
    if (!player1?.restaurantCardId) return;
    
    // If AI hasn't selected yet, auto-select
    if (player2 && !player2.restaurantCardId) {
      const timer = setTimeout(() => {
        const aiPosition = Math.random() < 0.5 ? 'top' : 'bottom';
        const updatedPlayer2 = selectRestaurantFromDeck(player2, aiPosition);
        
        setGameState({
          ...gameState,
          players: {
            ...gameState.players,
            player2: updatedPlayer2
          }
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Both players have selected - move to mulligan
    if (player1.restaurantCardId && player2?.restaurantCardId) {
      const timer = setTimeout(() => {
        setGameState({
          ...gameState,
          phase: GamePhase.MULLIGAN
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState]);

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
        // Start faceoff with sequential reveal
        const faceOffState = performFaceOff(gameState);
        setGameState(faceOffState);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState, aiOpponent]);

  // Handle sequential faceoff reveal
  useEffect(() => {
    if (!gameState || gameState.phase !== GamePhase.FACE_OFF) return;
    
    const faceoffState = gameState.faceoffState;
    if (!faceoffState) return;
    
    const maxCards = Math.max(
      faceoffState.revealOrder.player1.length,
      faceoffState.revealOrder.player2.length
    );
    
    // If not all cards revealed, auto-advance after a delay
    if (faceoffState.currentRevealIndex < maxCards) {
      const timer = setTimeout(() => {
        const nextState = revealNextCardPair(gameState);
        setGameState(nextState);
      }, 1500); // 1.5 second delay between reveals
      
      return () => clearTimeout(timer);
    } else {
      // All cards revealed - calculate final scores and transition to ROUND_END
      const timer = setTimeout(() => {
        const finalState = performFaceOff(gameState);
        setGameState(finalState);
      }, 1000); // 1 second delay after last card reveal
      
      return () => clearTimeout(timer);
    }
  }, [gameState]);

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
      phase: GamePhase.RESTAURANT_SELECTION,
      players: {
        player1: humanPlayer,
        player2: aiPlayer
      }
    };

    setGameState(updatedState);
  };

  const handleRestaurantSelection = (position: 'top' | 'bottom') => {
    if (!gameState) return;

    const player1 = gameState.players.player1;
    if (!player1) return;

    // Human player selects restaurant
    const updatedPlayer1 = selectRestaurantFromDeck(player1, position);
    
    setGameState({
      ...gameState,
      players: {
        ...gameState.players,
        player1: updatedPlayer1
      }
    });
    
    // AI selection and transition to mulligan will be handled by useEffect
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

    // Reveal restaurants after mulligan
    const stateWithRevealedRestaurants = revealRestaurants({
      ...gameState,
      players: {
        player1: { ...updatedPlayer1, ready: true },
        player2: updatedPlayer2
      }
    });

    // Move to coin flip
    const coinResult = flipCoin();
    const updatedState = setFirstPlayer(stateWithRevealedRestaurants, coinResult);

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

    // Reveal restaurants after mulligan
    const stateWithRevealedRestaurants = revealRestaurants({
      ...gameState,
      players: {
        player1: { ...player1, ready: true },
        player2: updatedPlayer2
      }
    });

    // Move to coin flip
    const coinResult = flipCoin();
    const updatedState = setFirstPlayer(stateWithRevealedRestaurants, coinResult);

    setGameState(updatedState);
  };

  const handleCardPlay = (cardId: string, activateSupport?: boolean, mealToDiscard?: string, handIndex?: number) => {
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

    const updatedPlayer1 = playCard(player1, cardId, targetType, mealToDiscard, activateSupport, handIndex);

    if (updatedPlayer1 === null) {
      if (!canAffordCard(player1, cardId)) {
        alert("You've hit your influence limit. You don't have enough influence to play this card.");
      } else {
        alert("You can't play this card right now.");
      }
      return;
    }

    setGameState({
      ...gameState,
      players: {
        ...gameState.players,
        player1: updatedPlayer1
      }
    });
  };

  const handleRemoveCardFromPlay = (cardId: string) => {
    if (!gameState?.players?.player1) return;
    const next = removeCardFromPlay(gameState.players.player1, cardId);
    if (!next) return;
    setGameState({
      ...gameState,
      players: { ...gameState.players, player1: next }
    });
  };

  const handleReorderPlayedCards = (fromIndex: number, toIndex: number) => {
    if (!gameState?.players?.player1) return;
    const next = reorderPlayedCard(gameState.players.player1, fromIndex, toIndex);
    setGameState({
      ...gameState,
      players: { ...gameState.players, player1: next }
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

  const handleProceedToFaceoff = () => {
    if (!gameState) return;
    const faceOffState = performFaceOff(gameState);
    setGameState(faceOffState);
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
                onClick={async () => {
                  const practiceDeck = await createPracticeDeck();
                  setPlayerDeck(practiceDeck);
                }} 
                className="lobby-button"
                title="Load a pre-built practice deck to learn the game"
              >
                📚 Load Practice Deck
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


  // Restaurant selection phase
  if (gameState.phase === GamePhase.RESTAURANT_SELECTION) {
    return (
      <div className="App">
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
        <GameBoard
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onCardPlay={handleCardPlay}
          onEndTurn={handleEndTurn}
          onNextRound={handleNextRound}
          onShowTutorial={() => setShowTutorial(true)}
          onRestaurantSelect={handleRestaurantSelection}
          onProceedToFaceoff={handleProceedToFaceoff}
          onRemoveCardFromPlay={handleRemoveCardFromPlay}
          onReorderPlayedCards={handleReorderPlayedCards}
        />
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

  // Main game phases (includes MULLIGAN so mulligan runs on board as overlay)
  if (
    gameState.phase === GamePhase.MULLIGAN ||
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
          mulliganCards={mulliganCards}
          onMulliganCardToggle={(cardId) => {
            setMulliganCards(prev => 
              prev.includes(cardId) 
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
            );
          }}
          onMulligan={handleMulligan}
          onSkipMulligan={handleSkipMulligan}
          onRestaurantSelect={handleRestaurantSelection}
          onProceedToFaceoff={handleProceedToFaceoff}
          onRemoveCardFromPlay={handleRemoveCardFromPlay}
          onReorderPlayedCards={handleReorderPlayedCards}
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
