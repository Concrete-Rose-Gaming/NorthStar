import React from 'react';
import { Card } from '../Card/Card';
import { getCardById } from '../../game/CardTypes';
import { PlayerBoardState } from '../../game/Scoring';
import { canAffordCard } from '../../game/GameEngine';
import './PlayerArea.css';

interface PlayerAreaProps {
  playerName: string;
  hand: string[]; // Card IDs
  boardState: PlayerBoardState;
  stars: number;
  influence?: number; // Current influence available
  maxInfluence?: number; // Maximum influence this round
  isCurrentPlayer?: boolean;
  onCardClick?: (cardId: string) => void;
  onEndTurn?: () => void;
  turnComplete?: boolean;
  isOpponent?: boolean; // If true, hide hand details
  showHand?: boolean; // Whether to show the hand (for human player)
  cardsPlayed?: number; // Number of cards played this round
  player?: any; // Player object for canAffordCard check (optional)
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  playerName,
  hand,
  boardState,
  stars,
  influence,
  maxInfluence,
  isCurrentPlayer = false,
  onCardClick,
  onEndTurn,
  turnComplete = false,
  isOpponent = false,
  showHand = false,
  cardsPlayed = 0,
  player
}) => {
  return (
    <div className={`player-area ${isCurrentPlayer ? 'current-player' : ''} ${isOpponent ? 'opponent-area' : ''}`}>
      <div className="player-header">
        <h3>{playerName}</h3>
        <div className="header-info">
          <div className="player-stars">Stars: {'⭐'.repeat(stars)}</div>
          {(influence !== undefined && maxInfluence !== undefined) && (
            <div className="player-influence">
              Influence: {influence}/{maxInfluence}⚡
            </div>
          )}
          {isOpponent && hand.length > 0 && (
            <div className="hand-count-badge">Hand: {hand.length} cards</div>
          )}
          <div className="cards-played-badge">Cards Played: {cardsPlayed}</div>
        </div>
      </div>

      <div className="player-board">
        <div className="board-section">
          <h4>Played Cards</h4>
          <div className="cards-row">
            {[
              ...boardState.playedMeals,
              ...boardState.playedStaff,
              ...boardState.playedSupport,
              ...boardState.playedEvents
            ].map(cardId => {
              const card = getCardById(cardId);
              return card ? <Card key={cardId} card={card} size="small" /> : null;
            })}
          </div>
        </div>
      </div>

      {hand.length > 0 && showHand && !isOpponent && (
        <div className="player-hand">
          <h4>Hand ({hand.length} cards)</h4>
          <div className="cards-row">
            {hand.map(cardId => {
              const card = getCardById(cardId);
              const canAfford = player ? canAffordCard(player, cardId) : true;
              return card ? (
                <Card
                  key={cardId}
                  card={card}
                  size="small"
                  onClick={() => onCardClick?.(cardId)}
                  disabled={!isCurrentPlayer || turnComplete}
                  canAfford={canAfford}
                />
              ) : null;
            })}
          </div>
        </div>
      )}
      {hand.length > 0 && isOpponent && showHand && (
        <div className="player-hand opponent-hand">
          <h4>Hand ({hand.length} cards)</h4>
          <div className="cards-row">
            {hand.map((_, index) => (
              <div key={index} className="hidden-card">
                <div className="card-back">?</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCurrentPlayer && !turnComplete && (
        <button className="end-turn-button" onClick={onEndTurn}>
          End Turn
        </button>
      )}

      {turnComplete && (
        <div className="turn-status">Turn Complete</div>
      )}
    </div>
  );
};

