import React from 'react';
import { RestaurantCard, MealCard, getCardById } from '../../game/CardTypes';
import { ArchetypeBadge } from '../ArchetypeBadge/ArchetypeBadge';
import './Restaurant.css';

interface RestaurantProps {
  restaurant: RestaurantCard;
  score?: number;
  stars?: number;
  size?: 'small' | 'medium' | 'large';
  attachedMeals?: string[]; // Card IDs of attached meals
}

export const Restaurant: React.FC<RestaurantProps> = ({
  restaurant,
  score,
  stars = 0,
  size = 'medium',
  attachedMeals = []
}) => {
  return (
    <div className={`restaurant-card restaurant-${size}`}>
      <div className="restaurant-header">
        <h2>{restaurant.name}</h2>
        <div className="restaurant-stars">
          {'⭐'.repeat(stars)}
        </div>
      </div>
      <div className="restaurant-body">
        <div className="restaurant-archetype">
          {restaurant.primaryArchetype ? (
            <ArchetypeBadge 
              archetype={restaurant.primaryArchetype}
              size={size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium'}
            />
          ) : (
            <span className="archetype-missing">No Type</span>
          )}
        </div>
        <p className="restaurant-description">{restaurant.description}</p>
        <div className="restaurant-base-score">
          Base Score: <strong>{restaurant.baseScore}</strong>
        </div>
        {score !== undefined && (
          <div className="restaurant-current-score">
            Current Score: <strong>{score}</strong>
          </div>
        )}
        {attachedMeals.length > 0 && (
          <div className="restaurant-attached-meals">
            <div className="attached-meals-label">Attached Meals ({attachedMeals.length}/3):</div>
            <div className="attached-meals-list">
              {attachedMeals.map(mealId => {
                const mealCard = getCardById(mealId) as MealCard | undefined;
                if (!mealCard) return null;
                return (
                  <div key={mealId} className="attached-meal-item">
                    <span className="attached-meal-name">{mealCard.name}</span>
                    <span className="attached-meal-value">+{mealCard.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="restaurant-ability">
          {restaurant.requiredStars !== undefined && restaurant.requiredStars > 0 && (
            <div className={`ability-star-requirement ${stars >= restaurant.requiredStars ? 'requirement-met' : 'requirement-unmet'}`}>
              Requires {restaurant.requiredStars} {restaurant.requiredStars === 1 ? 'star' : 'stars'} {'⭐'.repeat(restaurant.requiredStars)}
              {stars < restaurant.requiredStars && ` (You have ${stars})`}
            </div>
          )}
          <div className="ability-condition">{restaurant.abilityCondition}</div>
          <div className="ability-description">{restaurant.abilityDescription}</div>
        </div>
      </div>
    </div>
  );
};

