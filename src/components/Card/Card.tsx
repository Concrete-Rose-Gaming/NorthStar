import React from 'react';
import { Card as CardType, CardType as CardTypeEnum } from '../../game/CardTypes';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = 'medium'
}) => {
  const getCardColor = () => {
    switch (card.type) {
      case CardTypeEnum.CHEF:
        return '#FFD700'; // Gold
      case CardTypeEnum.RESTAURANT:
        return '#8B4513'; // Brown
      case CardTypeEnum.MEAL:
        return '#FF6347'; // Tomato
      case CardTypeEnum.STAFF:
        return '#4169E1'; // Royal Blue
      case CardTypeEnum.SUPPORT:
        return '#32CD32'; // Lime Green
      case CardTypeEnum.EVENT:
        return '#9370DB'; // Medium Purple
      default:
        return '#CCCCCC';
    }
  };

  const getCardValue = () => {
    if ('baseValue' in card) {
      return (card as any).baseValue;
    }
    if ('baseScore' in card) {
      return (card as any).baseScore;
    }
    if ('value' in card) {
      return (card as any).value;
    }
    return null;
  };

  const cardValue = getCardValue();

  return (
    <div
      className={`card card-${size} ${selected ? 'card-selected' : ''} ${disabled ? 'card-disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ borderColor: getCardColor() }}
    >
      <div className="card-header" style={{ backgroundColor: getCardColor() }}>
        <span className="card-type">{card.type}</span>
        {cardValue !== null && <span className="card-value">{cardValue}</span>}
      </div>
      <div className="card-body">
        <h3 className="card-name">{card.name}</h3>
        <p className="card-description">{card.description}</p>
        {'abilityDescription' in card && (
          <div className="card-ability">
            <strong>Ability:</strong> {card.abilityDescription}
          </div>
        )}
        {'effectDescription' in card && (
          <div className="card-effect">
            <strong>Effect:</strong> {card.effectDescription}
          </div>
        )}
      </div>
    </div>
  );
};

