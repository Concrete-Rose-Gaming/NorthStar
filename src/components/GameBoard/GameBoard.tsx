import React, { useState } from 'react';
import { GameState, GamePhase, canAffordCard } from '../../game/GameEngine';
import { PlayerArea } from '../PlayerArea/PlayerArea';
import { Restaurant } from '../Restaurant/Restaurant';
import { Card } from '../Card/Card';
import { getCardById } from '../../game/CardTypes';
import { calculateScore } from '../../game/Scoring';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: 'player1' | 'player2';
  onCardPlay: (cardId: string) => void;
  onEndTurn: () => void;
  onNextRound?: () => void;
  onShowTutorial?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  onCardPlay,
  onEndTurn,
  onNextRound,
  onShowTutorial
}) => {
  const [handPanelVisible, setHandPanelVisible] = useState(true);
  
  // Determine which player is "you" (current player viewing) and "opponent"
  // You (current player) always goes at bottom, opponent always at top
  const you = gameState.players[currentPlayerId];
  const opponentId = currentPlayerId === 'player1' ? 'player2' : 'player1';
  const opponent = gameState.players[opponentId];

  const youScore = you ? calculateScore(you.boardState).totalScore : 0;
  const opponentScore = opponent ? calculateScore(opponent.boardState).totalScore : 0;

  const youRestaurant = you?.restaurantCardId ? getCardById(you.restaurantCardId) : null;
  const opponentRestaurant = opponent?.restaurantCardId ? getCardById(opponent.restaurantCardId) : null;
  const youChef = you?.chefCardId ? getCardById(you.chefCardId) : null;
  const opponentChef = opponent?.chefCardId ? getCardById(opponent.chefCardId) : null;

  const isFaceOffPhase = gameState.phase === GamePhase.FACE_OFF;
  const showScores = isFaceOffPhase || gameState.phase === GamePhase.ROUND_END;
  const showHands = isFaceOffPhase || gameState.phase === GamePhase.ROUND_END || gameState.phase === GamePhase.GAME_END;
  const isAI = opponent?.name === 'AI Chef' || opponent?.name.includes('AI');

  // Count cards played this round by each player
  const opponentCardsPlayed = opponent ? 
    opponent.boardState.playedMeals.length + 
    opponent.boardState.playedStaff.length + 
    opponent.boardState.playedSupport.length + 
    opponent.boardState.playedEvents.length : 0;
  
  const youCardsPlayed = you ? 
    you.boardState.playedMeals.length + 
    you.boardState.playedStaff.length + 
    you.boardState.playedSupport.length + 
    you.boardState.playedEvents.length : 0;

  return (
    <div className="game-board">
      <div className="game-header">
        <div className="header-top">
          <h1>Round {gameState.currentRound}</h1>
          {onShowTutorial && (
            <button className="tutorial-button-header" onClick={onShowTutorial} title="How to Play">
              📖
            </button>
          )}
        </div>
        <div className="game-phase">Phase: {gameState.phase}</div>
        {isAI && (
          <div className="ai-indicator">🤖 Playing vs AI Opponent</div>
        )}
        {gameState.firstPlayer && (
          <div className="first-player">First Player: {gameState.players[gameState.firstPlayer]?.name}</div>
        )}
      </div>

      {/* Main content area - split screen layout */}
      <div className="main-content-area">
        {/* Left side - Opponent (compact) */}
        <div className="opponent-section">
          {opponent && (
            <PlayerArea
              playerName={opponent.name}
              hand={opponent.hand}
              boardState={opponent.boardState}
              stars={opponent.stars}
              influence={opponent.influence}
              maxInfluence={opponent.maxInfluence}
              isCurrentPlayer={false}
              onCardClick={undefined}
              onEndTurn={undefined}
              turnComplete={opponent.turnComplete}
              isOpponent={true}
              showHand={showHands} // Show cards only during face-off, but count always visible in header
              cardsPlayed={opponentCardsPlayed}
            />
          )}
        </div>

        {/* Middle section - Chef and Restaurant cards in one row */}
        <div className="middle-section">
          {/* Scores during face-off */}
          {showScores && (
            <div className="score-comparison-middle">
              <div className={`score-display ${youScore > opponentScore ? 'winner' : ''}`}>
                <h3>{you?.name || 'You'}</h3>
                <div className="score-value">{youScore}</div>
              </div>
              <div className="vs">VS</div>
              <div className={`score-display ${opponentScore > youScore ? 'winner' : ''}`}>
                <h3>{opponent?.name || 'Opponent'}</h3>
                <div className="score-value">{opponentScore}</div>
              </div>
            </div>
          )}
          
          {/* All four cards in one row: Restaurant (opponent) - Chef (opponent) - Chef (you) - Restaurant (you) */}
          <div className="middle-cards-row-single">
            {/* Opponent Restaurant */}
            {opponentRestaurant && (
              <div className="restaurant-card-wrapper-middle">
                <div className="middle-card-label">{opponent?.name || 'Opponent'}</div>
                <Restaurant
                  restaurant={opponentRestaurant as any}
                  score={showScores ? opponentScore : undefined}
                  stars={opponent?.stars || 0}
                  size="medium"
                />
              </div>
            )}
            
            {/* Opponent Chef */}
            {opponentChef && (
              <div className="chef-card-wrapper-middle">
                <div className="middle-card-label">{opponent?.name || 'Opponent'}</div>
                <Card card={opponentChef} size="medium" />
                <div className="card-label">Chef</div>
              </div>
            )}
            
            {/* Your Chef */}
            {youChef && (
              <div className="chef-card-wrapper-middle">
                <div className="middle-card-label">{you?.name || 'You'}</div>
                <Card card={youChef} size="medium" />
                <div className="card-label">Chef</div>
              </div>
            )}
            
            {/* Your Restaurant */}
            {youRestaurant && (
              <div className="restaurant-card-wrapper-middle">
                <div className="middle-card-label">{you?.name || 'You'}</div>
                <Restaurant
                  restaurant={youRestaurant as any}
                  score={showScores ? youScore : undefined}
                  stars={you?.stars || 0}
                  size="medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right side - Current player */}
        <div className="player-section">
          {you && (
            <PlayerArea
              playerName={you.name}
              hand={[]} // Hand is shown separately at bottom
              boardState={you.boardState}
              stars={you.stars}
              influence={you.influence}
              maxInfluence={you.maxInfluence}
              isCurrentPlayer={gameState.phase === GamePhase.TURN}
              onCardClick={undefined}
              onEndTurn={undefined}
              turnComplete={you.turnComplete}
              isOpponent={false}
              showHand={false} // Hand shown separately
              cardsPlayed={youCardsPlayed}
              player={you}
            />
          )}
        </div>
      </div>

      {/* Collapsible player hand area at bottom */}
      {you && (
        <div className={`player-hand-fixed ${!handPanelVisible ? 'collapsed' : ''}`}>
          <div className="hand-header">
            <div className="hand-header-left">
              <button 
                className="hand-toggle-button"
                onClick={() => setHandPanelVisible(!handPanelVisible)}
                title={handPanelVisible ? 'Hide Hand' : 'Show Hand'}
              >
                {handPanelVisible ? '▼' : '▲'}
              </button>
              <h4>Your Hand ({you.hand.length} cards)</h4>
            </div>
            <div className="hand-header-right">
              {gameState.phase === GamePhase.TURN && !you.turnComplete && (
                <button className="end-turn-button" onClick={onEndTurn}>
                  End Turn
                </button>
              )}
              {you.turnComplete && (
                <div className="turn-status">Turn Complete</div>
              )}
            </div>
          </div>
          {handPanelVisible && (
            <div className="cards-row">
              {you.hand.map(cardId => {
                const card = getCardById(cardId);
                const canAfford = canAffordCard(you, cardId);
                return card ? (
                  <Card
                    key={cardId}
                    card={card}
                    size="small"
                    onClick={() => onCardPlay(cardId)}
                    disabled={gameState.phase !== GamePhase.TURN || you.turnComplete}
                    canAfford={canAfford}
                  />
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {gameState.phase === GamePhase.ROUND_END && !gameState.winner && onNextRound && (
        <div className="round-end-actions">
          <button className="next-round-button" onClick={onNextRound}>
            Next Round
          </button>
        </div>
      )}

      {gameState.winner && (
        <div className="game-end">
          <h2>Game Over!</h2>
          <h3>{gameState.players[gameState.winner]?.name} Wins!</h3>
          <div className="final-stars">
            {gameState.players[gameState.winner]?.stars} Stars
          </div>
        </div>
      )}
    </div>
  );
};

