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
import { PlayerDeck, createStarterDeck1, createStarterDeck2 } from './game/DeckManager';
import { AIOpponent } from './game/AIOpponent';
import { getCardById, CardType } from './game/CardTypes';
import { loadCardsFromSupabase } from './game/CardLoader';
import { Tutorial } from './components/Tutorial/Tutorial';
import { Login } from './components/Login/Login';
import { DeckManager } from './components/DeckManager/DeckManager';
import { AuthUser, getCurrentUser, onAuthStateChange, signOut } from './supabase/auth';
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/App.tsx:App-function-entry',message:'App component function executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerDeck, setPlayerDeck] = useState<PlayerDeck | null>(null);
  const [mulliganCards, setMulliganCards] = useState<string[]>([]);
  const [showMulligan, setShowMulligan] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/App.tsx:App-state-initialized',message:'App component state initialized',data:{gameStateIsNull:gameState===null},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [aiOpponent] = useState<AIOpponent>(new AIOpponent('AI Chef'));
  // Current player ID - in single-player mode, always 'player1' (you are always at bottom)
  const currentPlayerId: 'player1' | 'player2' = 'player1';

  // Check auth state on mount
  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange(setUser);
    return () => unsubscribe();
  }, []);

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

  const [mealReplacementState, setMealReplacementState] = useState<{
    newMealId: string;
    attachedMeals: string[];
  } | null>(null);

  const handleCardPlay = (cardId: string, mealToDiscard?: string) => {
    if (!gameState) return;

    const player1 = gameState.players.player1;
    if (!player1 || player1.turnComplete) return;

    const card = getCardById(cardId);
    if (!card) return;

    // Check if trying to play an event card when one was already played this round
    if (card.type === CardType.EVENT && player1.eventCardPlayedThisRound) {
      // Prevent playing second event card - provide feedback
      alert('You can only play one event card per round.');
      return;
    }

    let targetType: 'meal' | 'staff' | 'support' | 'event' | undefined;
    if (card.type === CardType.MEAL) targetType = 'meal';
    else if (card.type === CardType.STAFF) targetType = 'staff';
    else if (card.type === CardType.SUPPORT) targetType = 'support';
    else if (card.type === CardType.EVENT) targetType = 'event';

    const updatedPlayer1 = playCard(player1, cardId, targetType, mealToDiscard);
    
    // If meal card requires replacement (restaurant has 3 meals), show selection UI
    if (card.type === CardType.MEAL && !updatedPlayer1 && player1.boardState.attachedMeals?.length >= 3) {
      setMealReplacementState({
        newMealId: cardId,
        attachedMeals: player1.boardState.attachedMeals || []
      });
      return;
    }
    
    if (!updatedPlayer1) {
      // Card couldn't be played for some reason
      return;
    }

    // Clear meal replacement state if it was set
    setMealReplacementState(null);
    
    setGameState({
      ...gameState,
      players: {
        ...gameState.players,
        player1: updatedPlayer1
      }
    });
  };

  const handleMealReplacement = (mealToDiscard: string) => {
    if (!mealReplacementState) return;
    
    handleCardPlay(mealReplacementState.newMealId, mealToDiscard);
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
    // #region agent log
    const computedStyle = window.getComputedStyle(document.body);
    const rootElement = document.getElementById('root');
    const rootComputedStyle = rootElement ? window.getComputedStyle(rootElement) : null;
    fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/App.tsx:App-lobby-render',message:'Rendering lobby screen (no gameState)',data:{showTutorial,bodyBg:computedStyle.background,rootExists:!!rootElement,rootDisplay:rootComputedStyle?.display,rootMinHeight:rootComputedStyle?.minHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return (
      <div className="App">
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
            <p className="lobby-description">Choose a starter deck or build your own!</p>
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
            
            {!playerDeck ? (
              <div className="starter-decks-section">
                <h3 className="starter-decks-title">Choose a Starter Deck</h3>
                <div className="starter-decks-grid">
                  <div className="starter-deck-card" onClick={() => {
                    const deck = createStarterDeck1();
                    handleDeckComplete(deck);
                  }}>
                    <div className="starter-deck-header">
                      <h4>The Balanced Chef</h4>
                      <span className="starter-deck-badge">📊 Balanced</span>
                    </div>
                    <p className="starter-deck-description">
                      A well-rounded deck with a good mix of Meals, Staff, Support, and Events. 
                      Perfect for learning the game!
                    </p>
                    <div className="starter-deck-stats">
                      <div className="starter-deck-stat">
                        <span className="stat-label">Chef:</span>
                        <span className="stat-value">Master Chef Pierre</span>
                      </div>
                      <div className="starter-deck-stat">
                        <span className="stat-label">Focus:</span>
                        <span className="stat-value">Versatile Strategy</span>
                      </div>
                    </div>
                    <button className="select-deck-button">Select This Deck</button>
                  </div>
                  
                  <div className="starter-deck-card" onClick={() => {
                    const deck = createStarterDeck2();
                    handleDeckComplete(deck);
                  }}>
                    <div className="starter-deck-header">
                      <h4>The High Roller</h4>
                      <span className="starter-deck-badge aggressive">⚡ Aggressive</span>
                    </div>
                    <p className="starter-deck-description">
                      Focus on high-value meals and powerful combos. 
                      Aggressive playstyle for maximum impact!
                    </p>
                    <div className="starter-deck-stats">
                      <div className="starter-deck-stat">
                        <span className="stat-label">Chef:</span>
                        <span className="stat-value">Chef Marcus</span>
                      </div>
                      <div className="starter-deck-stat">
                        <span className="stat-label">Focus:</span>
                        <span className="stat-value">High-Value Meals</span>
                      </div>
                    </div>
                    <button className="select-deck-button">Select This Deck</button>
                  </div>
                </div>
                <div className="or-divider">
                  <span>OR</span>
                </div>
                <button 
                  onClick={() => setShowDeckBuilder(true)} 
                  className="build-deck-button"
                >
                  🎴 Build Custom Deck
                </button>
              </div>
            ) : (
              <>
                <div className="lobby-actions">
                  <button 
                    onClick={() => {
                      setPlayerDeck(null);
                      setShowDeckBuilder(false);
                    }} 
                    className="lobby-button secondary"
                  >
                    ↻ Change Deck
                  </button>
                  <button 
                    onClick={handleStartGame} 
                    className="lobby-button ai-button" 
                    disabled={!playerName.trim()}
                  >
                    🤖 Start Game vs AI
                  </button>
                </div>
                <div className="deck-status">
                  <p className="deck-status-text">✓ Deck ready ({playerDeck.mainDeck.length} cards)</p>
                </div>
              </>
            )}
            
            {!playerName.trim() && playerDeck && (
              <p className="hint-text">Please enter your name to start</p>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Mulligan phase is now handled within GameBoard

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

  // Main game phases (including mulligan, which shows as overlay on game board)
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
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
        {mealReplacementState && (
          <div className="meal-replacement-modal">
            <div className="meal-replacement-content">
              <h3>Replace a Meal</h3>
              <p>Your restaurant already has 3 meals attached. Select a meal to discard:</p>
              <div className="meal-replacement-options">
                {mealReplacementState.attachedMeals.map(mealId => {
                  const mealCard = getCardById(mealId);
                  if (!mealCard) return null;
                  return (
                    <button
                      key={mealId}
                      className="meal-replacement-button"
                      onClick={() => handleMealReplacement(mealId)}
                    >
                      <div className="meal-replacement-name">{mealCard.name}</div>
                      <div className="meal-replacement-value">Value: +{(mealCard as any).value || 0}</div>
                    </button>
                  );
                })}
              </div>
              <button
                className="cancel-button"
                onClick={() => setMealReplacementState(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <GameBoard
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onCardPlay={handleCardPlay}
          onEndTurn={handleEndTurn}
          onNextRound={handleNextRound}
          onShowTutorial={() => setShowTutorial(true)}
          mulliganCards={gameState.phase === GamePhase.MULLIGAN ? mulliganCards : undefined}
          onMulliganCardToggle={gameState.phase === GamePhase.MULLIGAN ? (cardId: string) => {
            if (mulliganCards.includes(cardId)) {
              setMulliganCards(mulliganCards.filter(id => id !== cardId));
            } else {
              setMulliganCards([...mulliganCards, cardId]);
            }
          } : undefined}
          onMulligan={gameState.phase === GamePhase.MULLIGAN ? handleMulligan : undefined}
          onSkipMulligan={gameState.phase === GamePhase.MULLIGAN ? handleSkipMulligan : undefined}
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
