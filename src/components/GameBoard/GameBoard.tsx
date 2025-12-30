import React from 'react';
import { GameState, GamePhase } from '../../game/GameEngine';
import { PlayerArea } from '../PlayerArea/PlayerArea';
import { Restaurant } from '../Restaurant/Restaurant';
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
  const player1 = gameState.players.player1;
  const player2 = gameState.players.player2;

  const player1Score = player1 ? calculateScore(player1.boardState).totalScore : 0;
  const player2Score = player2 ? calculateScore(player2.boardState).totalScore : 0;

  const player1Restaurant = player1?.restaurantCardId ? getCardById(player1.restaurantCardId) : null;
  const player2Restaurant = player2?.restaurantCardId ? getCardById(player2.restaurantCardId) : null;

  const isFaceOffPhase = gameState.phase === GamePhase.FACE_OFF;
  const showScores = isFaceOffPhase || gameState.phase === GamePhase.ROUND_END;

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Round {gameState.currentRound}</h1>
        <div className="game-phase">Phase: {gameState.phase}</div>
        {gameState.firstPlayer && (
          <div className="first-player">First Player: {gameState.firstPlayer}</div>
        )}
      </div>

      {showScores && (
        <div className="score-comparison">
          <div className={`score-display ${player1Score > player2Score ? 'winner' : ''}`}>
            <h3>{player1?.name || 'Player 1'}</h3>
            <div className="score-value">{player1Score}</div>
          </div>
          <div className="vs">VS</div>
          <div className={`score-display ${player2Score > player1Score ? 'winner' : ''}`}>
            <h3>{player2?.name || 'Player 2'}</h3>
            <div className="score-value">{player2Score}</div>
          </div>
        </div>
      )}

      <div className="restaurants-row">
        {player1Restaurant && (
          <Restaurant
            restaurant={player1Restaurant as any}
            score={showScores ? player1Score : undefined}
            stars={player1?.stars || 0}
          />
        )}
        {player2Restaurant && (
          <Restaurant
            restaurant={player2Restaurant as any}
            score={showScores ? player2Score : undefined}
            stars={player2?.stars || 0}
          />
        )}
      </div>

      <div className="players-row">
        {player1 && (
          <PlayerArea
            playerName={player1.name}
            hand={player1.hand}
            boardState={player1.boardState}
            stars={player1.stars}
            isCurrentPlayer={currentPlayerId === 'player1' && gameState.phase === GamePhase.TURN}
            onCardClick={onCardPlay}
            onEndTurn={onEndTurn}
            turnComplete={player1.turnComplete}
          />
        )}
        {player2 && (
          <PlayerArea
            playerName={player2.name}
            hand={player2.hand}
            boardState={player2.boardState}
            stars={player2.stars}
            isCurrentPlayer={currentPlayerId === 'player2' && gameState.phase === GamePhase.TURN}
            onCardClick={onCardPlay}
            onEndTurn={onEndTurn}
            turnComplete={player2.turnComplete}
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

