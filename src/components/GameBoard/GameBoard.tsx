import React from 'react';
import { GameState, GamePhase } from '../../game/GameEngine';
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
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  onCardPlay,
  onEndTurn,
  onNextRound
}) => {
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

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Round {gameState.currentRound}</h1>
        <div className="game-phase">Phase: {gameState.phase}</div>
        {isAI && (
          <div className="ai-indicator">🤖 Playing vs AI Opponent</div>
        )}
        {gameState.firstPlayer && (
          <div className="first-player">First Player: {gameState.players[gameState.firstPlayer]?.name}</div>
        )}
      </div>


      {/* Opponent (AI or other player) - Always at top */}
      <div className="player-top">
        {opponent && (
          <PlayerArea
            playerName={opponent.name}
            hand={opponent.hand}
            boardState={opponent.boardState}
            stars={opponent.stars}
            isCurrentPlayer={false}
            onCardClick={undefined}
            onEndTurn={undefined}
            turnComplete={opponent.turnComplete}
            isOpponent={true}
            showHand={showHands} // Only show hand during face-off
          />
        )}
      </div>

      {/* Middle area - Chef and Restaurant cards side by side */}
      <div className="middle-cards-section">
        <div className="player-cards-group">
          <div className="player-label">{opponent?.name || 'Opponent'}</div>
          <div className="chef-restaurant-row">
            {opponentChef && (
              <div className="chef-card-wrapper">
                <Card card={opponentChef} size="medium" />
                <div className="card-label">Chef</div>
              </div>
            )}
            {opponentRestaurant && (
              <div className="restaurant-card-wrapper">
                <Restaurant
                  restaurant={opponentRestaurant as any}
                  score={showScores ? opponentScore : undefined}
                  stars={opponent?.stars || 0}
                />
              </div>
            )}
          </div>
        </div>

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

        <div className="player-cards-group">
          <div className="player-label">{you?.name || 'You'}</div>
          <div className="chef-restaurant-row">
            {youChef && (
              <div className="chef-card-wrapper">
                <Card card={youChef} size="medium" />
                <div className="card-label">Chef</div>
              </div>
            )}
            {youRestaurant && (
              <div className="restaurant-card-wrapper">
                <Restaurant
                  restaurant={youRestaurant as any}
                  score={showScores ? youScore : undefined}
                  stars={you?.stars || 0}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* You (current player) - Always at bottom */}
      <div className="player-bottom">
        {you && (
          <PlayerArea
            playerName={you.name}
            hand={you.hand} // You always see your own hand
            boardState={you.boardState}
            stars={you.stars}
            isCurrentPlayer={gameState.phase === GamePhase.TURN}
            onCardClick={onCardPlay}
            onEndTurn={onEndTurn}
            turnComplete={you.turnComplete}
            isOpponent={false}
            showHand={true} // You always see your hand
          />
        )}
      </div>

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

