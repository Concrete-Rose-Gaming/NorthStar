import React from 'react';
import { Card as CardType, CardType as CardTypeEnum, ChefCard, MealCard, StaffCard, EventCard, RestaurantCard } from '../../game/CardTypes';
import { ArchetypeBadge, DualArchetypeBadge } from '../ArchetypeBadge/ArchetypeBadge';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  canAfford?: boolean;  // Whether the player can afford to play this card (has enough influence)
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = 'medium',
  canAfford = true
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

  const getInfluenceCost = (): number | null => {
    if ('influenceCost' in card) {
      return (card as MealCard | StaffCard | EventCard).influenceCost;
    }
    return null;
  };

  const cardValue = getCardValue();
  const influenceCost = getInfluenceCost();
  // Only disable if explicitly disabled OR if influence cost exists and can't afford
  const isDisabled = disabled || (influenceCost !== null && !canAfford);

  // Get archetype information
  const chefCard = card.type === CardTypeEnum.CHEF ? card as ChefCard : null;
  const restaurantCard = card.type === CardTypeEnum.RESTAURANT ? card as RestaurantCard : null;
  const mealCard = card.type === CardTypeEnum.MEAL ? card as MealCard : null;
  const staffCard = card.type === CardTypeEnum.STAFF ? card as StaffCard : null;

  return (
    <div
      className={`card card-${size} ${selected ? 'card-selected' : ''} ${isDisabled ? 'card-disabled' : ''} ${!canAfford ? 'card-unaffordable' : ''}`}
      onClick={isDisabled ? undefined : onClick}
      style={{ borderColor: getCardColor() }}
    >
      <div className="card-header" style={{ backgroundColor: getCardColor() }}>
        <span className="card-type">{card.type}</span>
        <div className="card-header-values">
        {cardValue !== null && <span className="card-value">{cardValue}</span>}
          {influenceCost !== null && (
            <span className={`card-influence-cost ${!canAfford ? 'cost-unaffordable' : ''}`}>
              {influenceCost}⚡
            </span>
          )}
        </div>
      </div>
      <div className="card-body">
        <h3 className="card-name">{card.name}</h3>
        
        {/* Archetype badges */}
        {chefCard && (
          <div className="card-archetypes">
            {chefCard.secondaryArchetype ? (
              <DualArchetypeBadge 
                primary={chefCard.primaryArchetype} 
                secondary={chefCard.secondaryArchetype}
                size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
              />
            ) : (
              <ArchetypeBadge 
                archetype={chefCard.primaryArchetype}
                size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
              />
            )}
          </div>
        )}
        {restaurantCard && (
          <>
            {/* #region agent log */}
            {(() => { fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Card.tsx:110',message:'Restaurant card render',data:{cardId:restaurantCard.id,cardName:restaurantCard.name,primaryArchetype:restaurantCard.primaryArchetype,hasPrimaryArchetype:!!restaurantCard.primaryArchetype},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{}); return null; })()}
            {/* #endregion */}
            <div className="card-archetypes">
              {restaurantCard.primaryArchetype ? (
                <ArchetypeBadge 
                  archetype={restaurantCard.primaryArchetype}
                  size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
                />
              ) : (
                <span className="archetype-missing">No Type</span>
              )}
            </div>
          </>
        )}
        {mealCard?.mealArchetype && (
          <div className="card-archetypes">
            <ArchetypeBadge 
              archetype={mealCard.mealArchetype}
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
            />
          </div>
        )}
        {staffCard?.staffArchetype && (
          <div className="card-archetypes">
            <ArchetypeBadge 
              archetype={staffCard.staffArchetype}
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
            />
          </div>
        )}

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

