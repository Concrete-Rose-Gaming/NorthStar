import React, { useState } from 'react';
import { Card } from '../Card/Card';
import { CardPreview } from '../CardPreview/CardPreview';
import { getCardById } from '../../game/CardTypes';
import { PlayerBoardState } from '../../game/Scoring';
import { GamePhase, FaceoffState } from '../../game/GameEngine';
import './PlayerArea.css';

interface PlayerAreaProps {
  playerName: string;
  hand: string[]; // Card IDs
  boardState: PlayerBoardState;
  stars: number;
  isCurrentPlayer?: boolean;
  onCardClick?: (cardId: string) => void;
  onEndTurn?: () => void;
  turnComplete?: boolean;
  isOpponent?: boolean; // If true, hide hand details
  showHand?: boolean; // Whether to show the hand (for human player)
  cardsPlayed?: number; // Number of cards played this round
  influence?: number; // Current influence available
  maxInfluence?: number; // Maximum influence this round
  gamePhase?: GamePhase; // Current game phase
  faceoffState?: FaceoffState; // Faceoff reveal state
  playerId?: 'player1' | 'player2'; // Player ID for faceoff reveal lookup
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  playerName,
  hand,
  boardState,
  stars,
  isCurrentPlayer = false,
  onCardClick,
  onEndTurn,
  turnComplete = false,
  isOpponent = false,
  showHand = false,
  cardsPlayed = 0,
  influence,
  maxInfluence,
  gamePhase,
  faceoffState,
  playerId
}) => {
  // During Setup (TURN phase), cards are face-down
  // Owner can see their own cards, opponent sees face-down
  const isSetupPhase = gamePhase === GamePhase.TURN;
  
  const [previewedCard, setPreviewedCard] = useState<string | null>(null);
  
  // Get all played cards in play order
  const allPlayedCards = [
    ...boardState.playedStaff,
    ...boardState.playedSupport,
    ...boardState.playedEvents
  ];

  // Create a map of face-down cards for quick lookup
  const faceDownMap = new Map<string, boolean>();
  boardState.faceDownCards.forEach(cardState => {
    faceDownMap.set(cardState.cardId, cardState.isFaceDown);
  });
  
  // During faceoff, determine which cards are revealed
  const isFaceOffPhase = gamePhase === GamePhase.FACE_OFF;
  const revealedCards = faceoffState && playerId 
    ? faceoffState.revealedCards[playerId] 
    : [];

  return (
    <div className={`player-area ${isCurrentPlayer ? 'current-player' : ''} ${isOpponent ? 'opponent-area' : ''}`}>
      <div className="player-header">
        <h3>{playerName}</h3>
        <div className="header-info">
          <div className="player-stars">Stars: {'⭐'.repeat(stars)}</div>
          {(influence !== undefined || maxInfluence !== undefined) && (
            <div className="influence-badge">⚡ {influence || 0} / {maxInfluence || 0}</div>
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
            {allPlayedCards.map(cardId => {
              const card = getCardById(cardId);
              if (!card) return null;
              
              // During faceoff: only show revealed cards
              if (isFaceOffPhase) {
                const isRevealed = revealedCards.includes(cardId);
                if (!isRevealed) {
                  // Show face-down card
                  return (
                    <Card 
                      key={cardId} 
                      card={card} 
                      size="small"
                      isFaceDown={true}
                      showToOwner={false}
                      onPreview={() => setPreviewedCard(cardId)}
                    />
                  );
                }
                // Show revealed card
                return (
                  <Card 
                    key={cardId} 
                    card={card} 
                    size="small"
                    onPreview={() => setPreviewedCard(cardId)}
                  />
                );
              }
              
              // During Setup: face-down unless owner
              const isFaceDown = isSetupPhase && faceDownMap.get(cardId) === true;
              // Owner can see their own cards even when face-down
              const showToOwner = !isOpponent && isCurrentPlayer;
              
              return (
                <Card 
                  key={cardId} 
                  card={card} 
                  size="small"
                  isFaceDown={isFaceDown && !showToOwner}
                  showToOwner={showToOwner}
                  onPreview={() => setPreviewedCard(cardId)}
                />
              );
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
              return card ? (
                <Card
                  key={cardId}
                  card={card}
                  size="small"
                  onClick={() => onCardClick?.(cardId)}
                  disabled={!isCurrentPlayer || turnComplete}
                  onPreview={() => setPreviewedCard(cardId)}
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

      {/* Card Preview Modal */}
      {previewedCard && (() => {
        const card = getCardById(previewedCard);
        return card ? (
          <CardPreview 
            card={card} 
            onClose={() => setPreviewedCard(null)}
          />
        ) : null;
      })()}
    </div>
  );
};

