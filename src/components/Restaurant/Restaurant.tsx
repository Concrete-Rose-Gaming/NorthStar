import React from 'react';
import { RestaurantCard } from '../../game/CardTypes';
import './Restaurant.css';

interface RestaurantProps {
  restaurant: RestaurantCard;
  score?: number;
  stars?: number;
  size?: 'small' | 'medium' | 'large';
}

export const Restaurant: React.FC<RestaurantProps> = ({
  restaurant,
  score,
  stars = 0,
  size = 'medium'
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
        <p className="restaurant-description">{restaurant.description}</p>
        <div className="restaurant-base-score">
          Base Score: <strong>{restaurant.baseScore}</strong>
        </div>
        {score !== undefined && (
          <div className="restaurant-current-score">
            Current Score: <strong>{score}</strong>
          </div>
        )}
        <div className="restaurant-ability">
          <div className="ability-condition">{restaurant.abilityCondition}</div>
          <div className="ability-description">{restaurant.abilityDescription}</div>
        </div>
      </div>
    </div>
  );
};

