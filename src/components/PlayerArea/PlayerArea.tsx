import React, { useState, useRef } from 'react';
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
  /** Remove a played card (return to hand). Only used when current player in TURN phase. */
  onRemoveCard?: (cardId: string) => void;
  /** Reorder played cards (fromIndex, toIndex in combined staff/support/events list). */
  onReorderCards?: (fromIndex: number, toIndex: number) => void;
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
  playerId,
  onRemoveCard,
  onReorderCards
}) => {
  // During Setup (TURN phase), cards are face-down
  // Owner can see their own cards, opponent sees face-down
  const isSetupPhase = gamePhase === GamePhase.TURN;
  const [previewedCard, setPreviewedCard] = useState<string | null>(null);
  const dragJustEndedRef = useRef(false);
  const canEditPlayed = Boolean(
    isSetupPhase && isCurrentPlayer && !turnComplete && !isOpponent && onRemoveCard && onReorderCards
  );
  
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
          <h4>Played Cards{canEditPlayed && <span className="played-cards-hint"> — Click to return to hand, drag to reorder</span>}</h4>
          <div className="cards-row cards-row-played">
            {allPlayedCards.map((cardId, index) => {
              const card = getCardById(cardId);
              if (!card) return null;
              const uniqueKey = `played-${index}-${cardId}`;
              
              // During faceoff: only show revealed cards
              if (isFaceOffPhase) {
                const isRevealed = revealedCards.includes(cardId);
                if (!isRevealed) {
                  return (
                    <Card 
                      key={uniqueKey} 
                      card={card} 
                      size="small"
                      isFaceDown={true}
                      showToOwner={false}
                      onPreview={() => setPreviewedCard(cardId)}
                    />
                  );
                }
                return (
                  <Card 
                    key={uniqueKey} 
                    card={card} 
                    size="small"
                    onPreview={() => setPreviewedCard(cardId)}
                  />
                );
              }
              
              // During Setup: face-down unless owner; optionally draggable/removable
              const isFaceDown = isSetupPhase && faceDownMap.get(cardId) === true;
              const showToOwner = !isOpponent && isCurrentPlayer;
              const cardEl = (
                <Card 
                  key={uniqueKey} 
                  card={card} 
                  size="small"
                  isFaceDown={isFaceDown && !showToOwner}
                  showToOwner={showToOwner}
                  onPreview={() => setPreviewedCard(cardId)}
                />
              );
              if (!canEditPlayed) return cardEl;
              return (
                <div
                  key={uniqueKey}
                  className="played-card-slot played-card-editable"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ fromIndex: index }));
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
                  }}
                  onDragEnd={() => {
                    dragJustEndedRef.current = true;
                    setTimeout(() => { dragJustEndedRef.current = false; }, 0);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    e.currentTarget.classList.add('played-card-drop-target');
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('played-card-drop-target')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('played-card-drop-target');
                    try {
                      const d = JSON.parse(e.dataTransfer.getData('application/json'));
                      const from = d.fromIndex as number;
                      if (typeof from === 'number' && from !== index) onReorderCards?.(from, index);
                    } catch (_) {}
                  }}
                  onClick={() => {
                    if (!dragJustEndedRef.current) onRemoveCard?.(cardId);
                  }}
                >
                  {cardEl}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hand.length > 0 && showHand && !isOpponent && (
        <div className="player-hand">
          <h4>Hand ({hand.length} cards)</h4>
          <div className="cards-row">
            {hand.map((cardId, index) => {
              const card = getCardById(cardId);
              return card ? (
                <Card
                  key={`hand-${index}-${cardId}`}
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

