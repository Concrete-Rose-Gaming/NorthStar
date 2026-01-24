import React from 'react';
import { Card as CardType, CardType as CardTypeEnum, ChefCard, MealCard, StaffCard, EventCard, RestaurantCard, SupportCard } from '../../game/CardTypes';
import { Card } from '../Card/Card';
import './CardPreview.css';

interface CardPreviewProps {
  card: CardType;
  onClose: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const chefCard = card.type === CardTypeEnum.CHEF ? card as ChefCard : null;
  const restaurantCard = card.type === CardTypeEnum.RESTAURANT ? card as RestaurantCard : null;
  const mealCard = card.type === CardTypeEnum.MEAL ? card as MealCard : null;
  const staffCard = card.type === CardTypeEnum.STAFF ? card as StaffCard : null;
  const eventCard = card.type === CardTypeEnum.EVENT ? card as EventCard : null;
  const supportCard = card.type === CardTypeEnum.SUPPORT ? card as SupportCard : null;

  return (
    <div 
      className="card-preview-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="card-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-preview-header">
          <h2>Card Details</h2>
          <button className="card-preview-close" onClick={onClose} aria-label="Close preview">×</button>
        </div>
        
        <div className="card-preview-content">
          <div className="card-preview-card-wrapper">
            <Card card={card} size="large" />
          </div>
          
          <div className="card-preview-details">
            <div className="card-preview-section">
              <h3>Basic Information</h3>
              <div className="card-preview-info-grid">
                <div className="card-preview-info-item">
                  <strong>Type:</strong> <span>{card.type}</span>
                </div>
                <div className="card-preview-info-item">
                  <strong>Name:</strong> <span>{card.name}</span>
                </div>
                {chefCard && (
                  <>
                    <div className="card-preview-info-item">
                      <strong>Base Value:</strong> <span>{chefCard.baseValue}</span>
                    </div>
                    <div className="card-preview-info-item">
                      <strong>Starting Influence:</strong> <span>{chefCard.startingInfluence}</span>
                    </div>
                    <div className="card-preview-info-item">
                      <strong>Star Bonus Influence:</strong> <span>{chefCard.starBonusInfluence}</span>
                    </div>
                  </>
                )}
                {restaurantCard && (
                  <>
                    <div className="card-preview-info-item">
                      <strong>Base Score:</strong> <span>{restaurantCard.baseScore}</span>
                    </div>
                    {restaurantCard.requiredStars !== undefined && restaurantCard.requiredStars > 0 && (
                      <div className="card-preview-info-item">
                        <strong>Required Stars:</strong> <span>{restaurantCard.requiredStars}</span>
                      </div>
                    )}
                  </>
                )}
                {mealCard && (
                  <>
                    <div className="card-preview-info-item">
                      <strong>Value:</strong> <span>{mealCard.value}</span>
                    </div>
                    <div className="card-preview-info-item">
                      <strong>Influence Cost:</strong> <span>{mealCard.influenceCost}⚡</span>
                    </div>
                  </>
                )}
                {staffCard && (
                  <div className="card-preview-info-item">
                    <strong>Influence Cost:</strong> <span>{staffCard.influenceCost}⚡</span>
                  </div>
                )}
                {eventCard && (
                  <div className="card-preview-info-item">
                    <strong>Influence Cost:</strong> <span>{eventCard.influenceCost}⚡</span>
                  </div>
                )}
              </div>
            </div>

            {chefCard && (
              <div className="card-preview-section">
                <h3>Archetypes</h3>
                <div className="card-preview-archetypes">
                  <div className="card-preview-info-item">
                    <strong>Primary:</strong> <span>{chefCard.primaryArchetype}</span>
                  </div>
                  {chefCard.secondaryArchetype && (
                    <div className="card-preview-info-item">
                      <strong>Secondary:</strong> <span>{chefCard.secondaryArchetype}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {restaurantCard && restaurantCard.primaryArchetype && (
              <div className="card-preview-section">
                <h3>Archetype</h3>
                <div className="card-preview-info-item">
                  <strong>Type:</strong> <span>{restaurantCard.primaryArchetype}</span>
                </div>
              </div>
            )}

            {(mealCard?.mealArchetype || staffCard?.staffArchetype) && (
              <div className="card-preview-section">
                <h3>Archetype</h3>
                <div className="card-preview-info-item">
                  <strong>Type:</strong> <span>{mealCard?.mealArchetype || staffCard?.staffArchetype}</span>
                </div>
              </div>
            )}

            <div className="card-preview-section">
              <h3>Description</h3>
              <p className="card-preview-description">{card.description}</p>
            </div>

            {chefCard && (
              <div className="card-preview-section">
                <h3>Ability</h3>
                <div className="card-preview-ability">
                  <strong>{chefCard.ability}:</strong> {chefCard.abilityDescription}
                </div>
              </div>
            )}

            {restaurantCard && (
              <div className="card-preview-section">
                <h3>Restaurant Ability</h3>
                <div className="card-preview-ability">
                  <div className="card-preview-info-item">
                    <strong>Ability:</strong> <span>{restaurantCard.ability}</span>
                  </div>
                  {restaurantCard.abilityCondition && (
                    <div className="card-preview-info-item">
                      <strong>Condition:</strong> <span>{restaurantCard.abilityCondition}</span>
                    </div>
                  )}
                  <div className="card-preview-info-item">
                    <strong>Effect:</strong> <span>{restaurantCard.abilityDescription}</span>
                  </div>
                </div>
              </div>
            )}

            {staffCard && (
              <div className="card-preview-section">
                <h3>Staff Ability</h3>
                <div className="card-preview-ability">
                  <strong>{staffCard.ability}:</strong> {staffCard.abilityDescription}
                </div>
                {staffCard.modifier !== undefined && (
                  <div className="card-preview-info-item">
                    <strong>Modifier:</strong> <span>{staffCard.modifier > 0 ? '+' : ''}{staffCard.modifier}</span>
                  </div>
                )}
              </div>
            )}

            {supportCard && (
              <div className="card-preview-section">
                <h3>Support Ability</h3>
                <div className="card-preview-ability">
                  <strong>{supportCard.ability}:</strong> {supportCard.abilityDescription}
                </div>
                {supportCard.duration && (
                  <div className="card-preview-info-item">
                    <strong>Duration:</strong> <span>{supportCard.duration}</span>
                  </div>
                )}
              </div>
            )}

            {eventCard && (
              <div className="card-preview-section">
                <h3>Event Effect</h3>
                <div className="card-preview-effect">
                  <div className="card-preview-info-item">
                    <strong>Effect:</strong> <span>{eventCard.effect}</span>
                  </div>
                  <div className="card-preview-info-item">
                    <strong>Description:</strong> <span>{eventCard.effectDescription}</span>
                  </div>
                  {eventCard.target && (
                    <div className="card-preview-info-item">
                      <strong>Target:</strong> <span>{eventCard.target}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mealCard?.effectDescription && (
              <div className="card-preview-section">
                <h3>Effect</h3>
                <div className="card-preview-effect">
                  {mealCard.effectDescription}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
