import React, { useState } from 'react';
import { Card } from '../Card/Card';
import { CardType, CARD_DEFINITIONS, getCardsByType, Card as CardTypeDef } from '../../game/CardTypes';
import { Deck, validateDeck, getDeckStats } from '../../game/DeckManager';
import './DeckBuilder.css';

interface DeckBuilderProps {
  onDeckComplete: (deck: Deck) => void;
  initialDeck?: Deck;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  onDeckComplete,
  initialDeck = []
}) => {
  const [currentDeck, setCurrentDeck] = useState<Deck>(initialDeck);
  const [selectedType, setSelectedType] = useState<CardType | 'ALL'>('ALL');
  const [validationResult, setValidationResult] = useState<any>(null);

  const stats = getDeckStats(currentDeck);

  const handleAddCard = (cardId: string) => {
    const newDeck = [...currentDeck, cardId];
    setCurrentDeck(newDeck);
    const result = validateDeck(newDeck);
    setValidationResult(result);
  };

  const handleRemoveCard = (cardId: string) => {
    const index = currentDeck.indexOf(cardId);
    if (index > -1) {
      const newDeck = [...currentDeck];
      newDeck.splice(index, 1);
      setCurrentDeck(newDeck);
      const result = validateDeck(newDeck);
      setValidationResult(result);
    }
  };

  const getAvailableCards = () => {
    if (selectedType === 'ALL') {
      return Object.values(CARD_DEFINITIONS);
    }
    return getCardsByType(selectedType);
  };

  const getCardCount = (cardId: string) => {
    return currentDeck.filter(id => id === cardId).length;
  };

  const handleFinish = () => {
    const result = validateDeck(currentDeck);
    if (result.isValid) {
      onDeckComplete(currentDeck);
    } else {
      setValidationResult(result);
    }
  };

  return (
    <div className="deck-builder">
      <h2>Deck Builder</h2>
      
      <div className="deck-stats">
        <div className="stat-item">
          <strong>Total Cards:</strong> {stats.totalCards} / 30
        </div>
        <div className="stat-item">
          <strong>Chef:</strong> {stats.chefCount} / 1
        </div>
        <div className="stat-item">
          <strong>Restaurants:</strong> {stats.restaurantCount} / 3
        </div>
        <div className="stat-item">
          <strong>Meals:</strong> {stats.mealCount}
        </div>
        <div className="stat-item">
          <strong>Staff:</strong> {stats.staffCount}
        </div>
        <div className="stat-item">
          <strong>Support:</strong> {stats.supportCount}
        </div>
        <div className="stat-item">
          <strong>Events:</strong> {stats.eventCount}
        </div>
      </div>

      {validationResult && (
        <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
          {validationResult.errors.length > 0 && (
            <div className="errors">
              <strong>Errors:</strong>
              <ul>
                {validationResult.errors.map((error: string, i: number) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validationResult.warnings.length > 0 && (
            <div className="warnings">
              <strong>Warnings:</strong>
              <ul>
                {validationResult.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="deck-builder-content">
        <div className="card-library">
          <div className="type-filter">
            <button
              className={selectedType === 'ALL' ? 'active' : ''}
              onClick={() => setSelectedType('ALL')}
            >
              All
            </button>
            {Object.values(CardType).map(type => (
              <button
                key={type}
                className={selectedType === type ? 'active' : ''}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="cards-grid">
            {getAvailableCards().map(card => {
              const count = getCardCount(card.id);
              const maxReached = count >= 3;
              const isChefOrRestaurant = card.type === CardType.CHEF || card.type === CardType.RESTAURANT;
              const chefInDeck = card.type === CardType.CHEF && count >= 1;
              const restaurantsInDeck = card.type === CardType.RESTAURANT && count >= 3;

              return (
                <div key={card.id} className="library-card-wrapper">
                  <Card
                    card={card}
                    size="small"
                    onClick={() => !maxReached && handleAddCard(card.id)}
                    disabled={maxReached || chefInDeck || restaurantsInDeck}
                  />
                  <div className="card-count">
                    In deck: {count} / {isChefOrRestaurant ? (card.type === CardType.CHEF ? 1 : 3) : 3}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="current-deck">
          <h3>Current Deck ({currentDeck.length} cards)</h3>
          <div className="deck-list">
            {Object.entries(stats.cardCounts).map(([cardId, count]) => {
              const card = CARD_DEFINITIONS[cardId];
              if (!card) return null;
              return (
                <div key={cardId} className="deck-item">
                  <span>{card.name} x{count}</span>
                  <button onClick={() => handleRemoveCard(cardId)}>Remove</button>
                </div>
              );
            })}
          </div>
          <button
            className="finish-button"
            onClick={handleFinish}
            disabled={!validationResult?.isValid}
          >
            Finish Deck
          </button>
        </div>
      </div>
    </div>
  );
};

