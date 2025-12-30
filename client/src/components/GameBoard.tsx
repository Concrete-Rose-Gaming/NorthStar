import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import { GameAction, AnyCard, GamePhase } from '@culinary-game/shared';
import Chat from './Chat';
import './GameBoard.css';

interface GameBoardProps {
  username: string;
}

function GameBoard({ username }: GameBoardProps) {
  const { gameState, currentGameId, setCurrentGameId } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    if (currentGameId) {
      // Join the game if not already joined
      socketService.joinGame(currentGameId, username);
      socketService.requestGameState(currentGameId);
    }
  }, [currentGameId, username]);

  if (!gameState || !currentGameId) {
    return <div>Loading game...</div>;
  }

  const currentPlayer = gameState.players.find(p => p.id === socketService.getSocket()?.id);
  const opponent = gameState.players.find(p => p.id !== socketService.getSocket()?.id);

  if (!currentPlayer || !opponent) {
    return <div>Waiting for players...</div>;
  }

  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayer.id;
  const canMulligan = gameState.phase === GamePhase.MULLIGAN && !currentPlayer.isReady;

  const handleMulligan = () => {
    const action: GameAction = {
      type: 'MULLIGAN',
      playerId: currentPlayer.id
    };
    socketService.sendGameAction(action);
  };

  const handlePlayCard = (cardId: string) => {
    if (!isMyTurn || gameState.phase !== GamePhase.ROUND) return;

    const action: GameAction = {
      type: 'PLAY_CARD',
      playerId: currentPlayer.id,
      cardId
    };
    socketService.sendGameAction(action);
    setSelectedCard(null);
  };

  const handleEndTurn = () => {
    if (!isMyTurn || gameState.phase !== GamePhase.ROUND) return;

    const action: GameAction = {
      type: 'END_TURN',
      playerId: currentPlayer.id
    };
    socketService.sendGameAction(action);
  };

  const handleLeaveGame = () => {
    setCurrentGameId(null);
  };

  const renderCard = (card: AnyCard, onClick?: () => void) => {
    const handleClick = onClick ? (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    } : undefined;
    
    return (
      <div
        key={card.id}
        className={`card ${selectedCard === card.id ? 'selected' : ''} ${onClick ? 'clickable' : ''}`}
        onClick={handleClick}
        style={onClick ? { cursor: 'pointer' } : {}}
      >
        <div className="card-name">{card.name}</div>
        <div className="card-type">{card.type}</div>
        <div className="card-description">{card.description}</div>
        {card.type === 'CHEF' && (card as any).health !== undefined && (
          <div className="card-stats">
            <span>Health: {(card as any).health}</span>
            <span>Attack: {(card as any).attack || 0}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Culinary Card Game</h1>
        <div className="game-info">
          <span>Round: {gameState.roundNumber}</span>
          <span>Phase: {gameState.phase}</span>
          <span>Legendary Stars Pool: {gameState.legendaryStarsPool}</span>
          <button onClick={handleLeaveGame}>Leave Game</button>
        </div>
      </div>

      {gameState.phase === GamePhase.VICTORY && (
        <div className="victory-screen">
          <h2>{gameState.winner === currentPlayer.id ? 'You Win!' : 'You Lose!'}</h2>
        </div>
      )}

      <div className="game-content">
        <div className="game-area">
          {/* Opponent Area */}
          <div className="opponent-area">
            <div className="player-info">
              <h3>{opponent.username} {opponent.isAI ? '(AI)' : ''}</h3>
              <div>Legendary Stars: {opponent.legendaryStars}/5</div>
              {opponent.chef && (
                <div className="chef-display">
                  <h4>Chef: {opponent.chef.name}</h4>
                  <div>Health: {opponent.chef.health} | Attack: {opponent.chef.attack || 0}</div>
                </div>
              )}
            </div>
            <div className="restaurants">
              <h4>Restaurants:</h4>
              <div className="restaurant-cards">
                {opponent.restaurants.map(rest => renderCard(rest))}
              </div>
            </div>
            <div className="board">
              <h4>Board:</h4>
              <div className="board-cards">
                {opponent.board.map(card => renderCard(card))}
              </div>
            </div>
          </div>

          {/* Central Area - Legendary Stars */}
          <div className="central-area">
            <div className="legendary-stars">
              <h2>Legendary Stars</h2>
              <div className="stars-display">
                <div className="player-stars">
                  <div className="star-count">{currentPlayer.legendaryStars}</div>
                  <div>{currentPlayer.username}</div>
                </div>
                <div className="stars-pool">{gameState.legendaryStarsPool} remaining</div>
                <div className="player-stars">
                  <div className="star-count">{opponent.legendaryStars}</div>
                  <div>{opponent.username}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Player Area */}
          <div className="player-area">
            <div className="player-info">
              <h3>{currentPlayer.username}</h3>
              <div>Legendary Stars: {currentPlayer.legendaryStars}/5</div>
              {currentPlayer.chef && (
                <div className="chef-display">
                  <h4>Chef: {currentPlayer.chef.name}</h4>
                  <div>Health: {currentPlayer.chef.health} | Attack: {currentPlayer.chef.attack || 0}</div>
                </div>
              )}
            </div>
            <div className="restaurants">
              <h4>Restaurants:</h4>
              <div className="restaurant-cards">
                {currentPlayer.restaurants.map(rest => renderCard(rest))}
              </div>
            </div>
            <div className="board">
              <h4>Board:</h4>
              <div className="board-cards">
                {currentPlayer.board.map(card => renderCard(card))}
              </div>
            </div>
            <div className="hand">
              <h4>Hand ({currentPlayer.hand.length}):</h4>
              <div className="hand-cards">
                {currentPlayer.hand.map(card =>
                  renderCard(
                    card,
                    isMyTurn && gameState.phase === GamePhase.ROUND
                      ? () => handlePlayCard(card.id)
                      : undefined
                  )
                )}
              </div>
            </div>
            <div className="actions">
              {canMulligan && (
                <button onClick={handleMulligan} className="action-button">
                  Mulligan
                </button>
              )}
              {isMyTurn && gameState.phase === GamePhase.ROUND && (
                <button onClick={handleEndTurn} className="action-button">
                  End Turn
                </button>
              )}
              {!isMyTurn && gameState.phase === GamePhase.ROUND && (
                <div className="waiting">Waiting for opponent...</div>
              )}
              {gameState.phase === GamePhase.HEAD_TO_HEAD && (
                <div className="head-to-head">Head-to-Head Combat!</div>
              )}
            </div>
          </div>
        </div>

        <Chat username={username} roomId={currentGameId} />
      </div>
    </div>
  );
}

export default GameBoard;

