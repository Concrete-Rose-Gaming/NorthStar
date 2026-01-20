import React from 'react';
import { LocalCard } from '../../types/Card';
import './CardPreview.css';

interface CardPreviewProps {
  card: LocalCard;
}

function CardPreview({ card }: CardPreviewProps) {
  const renderTypeSpecificInfo = () => {
    switch (card.card_type) {
      case 'CHEF':
        return (
          <div className="card-preview-section">
            <h4>Chef Data</h4>
            <p><strong>Starting Influence:</strong> {card.chef_data?.starting_influence ?? 'N/A'}</p>
            <p><strong>Star Bonus Influence:</strong> {card.chef_data?.star_bonus_influence ?? 'N/A'}</p>
            <p><strong>Primary Archetype:</strong> {card.chef_data?.Restaurant_Focus_1 || 'N/A'}</p>
            {card.chef_data?.Restaurant_Focus_2 && (
              <p><strong>Secondary Archetype:</strong> {card.chef_data.Restaurant_Focus_2}</p>
            )}
          </div>
        );
      case 'RESTAURANT':
        return (
          <div className="card-preview-section">
            <h4>Restaurant Data</h4>
            <p><strong>Primary Archetype:</strong> {card.restaurant_data?.Restaurant_Focus_1 || 'N/A'}</p>
            {card.restaurant_data?.Restaurant_Focus_2 && (
              <p><strong>Secondary Archetype:</strong> {card.restaurant_data.Restaurant_Focus_2}</p>
            )}
            <p><strong>Required Stars:</strong> {card.restaurant_data?.required_stars ?? 'N/A'}</p>
          </div>
        );
      case 'MEAL':
        return (
          <div className="card-preview-section">
            <h4>Meal Data</h4>
            <p><strong>Influence Cost:</strong> {card.meal_data?.influence_cost ?? 'N/A'}</p>
            <p><strong>Food Type:</strong> {card.meal_data?.food_type || 'N/A'}</p>
            {card.meal_data?.restaurant_type_1 && (
              <p><strong>Restaurant Type 1:</strong> {card.meal_data.restaurant_type_1}</p>
            )}
            {card.meal_data?.restaurant_type_2 && (
              <p><strong>Restaurant Type 2:</strong> {card.meal_data.restaurant_type_2}</p>
            )}
          </div>
        );
      case 'STAFF':
        return (
          <div className="card-preview-section">
            <h4>Staff Data</h4>
            <p><strong>Influence Cost:</strong> {card.staff_data?.influence_cost ?? 'N/A'}</p>
            <p><strong>Employee Type:</strong> {card.staff_data?.employee_type || 'N/A'}</p>
            {card.staff_data?.restaurant_type && (
              <p><strong>Restaurant Type:</strong> {card.staff_data.restaurant_type}</p>
            )}
          </div>
        );
      case 'EVENT':
        return (
          <div className="card-preview-section">
            <h4>Event Data</h4>
            <p><strong>Influence Cost:</strong> {card.event_data?.influence_cost ?? 'N/A'}</p>
            {card.event_data?.first_enum && (
              <p><strong>First Enum:</strong> {card.event_data.first_enum}</p>
            )}
            {card.event_data?.second_enum && (
              <p><strong>Second Enum:</strong> {card.event_data.second_enum}</p>
            )}
          </div>
        );
      case 'SUPPORT':
        return (
          <div className="card-preview-section">
            <h4>Support Card</h4>
            <p>Duration information stored in effect field</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card-preview">
      <div className="card-preview-header">
        <h3>{card.name || 'Unnamed Card'}</h3>
        <span className="card-preview-code">{card.code || 'No Code'}</span>
      </div>

      {card.card_art && (
        <div className="card-preview-image">
          <img src={card.card_art} alt={card.name} />
        </div>
      )}

      <div className="card-preview-body">
        <div className="card-preview-section">
          <h4>Basic Information</h4>
          <p><strong>Type:</strong> {card.card_type}</p>
          <p><strong>Expansion:</strong> {card.expansion || 'N/A'}</p>
          <p><strong>Card Number:</strong> {card.card_number || 'N/A'}</p>
          <p><strong>Description:</strong> {card.description || 'No description'}</p>
          {card.effect && (
            <p><strong>Effect:</strong> {card.effect}</p>
          )}
          {card.value !== null && (
            <p><strong>Value:</strong> {card.value}</p>
          )}
          {card.rarity && (
            <p><strong>Rarity:</strong> {card.rarity}</p>
          )}
          <p><strong>Worth:</strong> {card.worth || 0}</p>
        </div>

        {renderTypeSpecificInfo()}
      </div>
    </div>
  );
}

export default CardPreview;

