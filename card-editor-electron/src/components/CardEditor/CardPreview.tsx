import React, { useState, useEffect } from 'react';
import { LocalCard } from '../../services/LocalCardStorage';
import { ArtworkStorage } from '../../services/ArtworkStorage';
import './CardPreview.css';

interface CardPreviewProps {
  card: LocalCard;
}

function CardPreview({ card }: CardPreviewProps) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

  useEffect(() => {
    loadArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.artwork_local_path, card.card_art]);

  const loadArtwork = async () => {
    if (card.card_art && card.card_art.startsWith('http')) {
      // Supabase URL
      setArtworkUrl(card.card_art);
    } else if (card.artwork_local_path) {
      // Local file
      const { success, dataUrl } = await ArtworkStorage.getArtworkAsDataUrl(card.code);
      if (success && dataUrl) {
        setArtworkUrl(dataUrl);
      } else {
        setArtworkUrl(null);
      }
    } else {
      setArtworkUrl(null);
    }
  };

  const getCardColor = () => {
    switch (card.card_type) {
      case 'CHEF':
        return '#FFD700';
      case 'RESTAURANT':
        return '#8B4513';
      case 'MEAL':
        return '#FF6347';
      case 'STAFF':
        return '#4169E1';
      case 'SUPPORT':
        return '#32CD32';
      case 'EVENT':
        return '#9370DB';
      default:
        return '#CCCCCC';
    }
  };

  const getCardValue = () => {
    if (card.value !== null) {
      return card.value;
    }
    return null;
  };

  const getInfluenceCost = () => {
    if (card.meal_data?.influence_cost) return card.meal_data.influence_cost;
    if (card.staff_data?.influence_cost) return card.staff_data.influence_cost;
    if (card.event_data?.influence_cost) return card.event_data.influence_cost;
    return null;
  };

  const cardValue = getCardValue();
  const influenceCost = getInfluenceCost();

  return (
    <div className="card-preview">
      <div
        className="card-preview-card"
        style={{ borderColor: getCardColor() }}
      >
        <div className="card-preview-header" style={{ backgroundColor: getCardColor() }}>
          <span className="card-preview-type">{card.card_type}</span>
          <div className="card-preview-header-values">
            {cardValue !== null && <span className="card-preview-value">{cardValue}</span>}
            {influenceCost !== null && (
              <span className="card-preview-influence">{influenceCost}⚡</span>
            )}
          </div>
        </div>
        <div className="card-preview-body">
          {artworkUrl && (
            <div className="card-preview-artwork">
              <img src={artworkUrl} alt={card.name} />
            </div>
          )}
          <h3 className="card-preview-name">{card.name || 'Unnamed Card'}</h3>
          {card.chef_data?.Restaurant_Focus_1 && (
            <div className="card-preview-archetype">
              {card.chef_data.Restaurant_Focus_1}
              {card.chef_data.Restaurant_Focus_2 && ` / ${card.chef_data.Restaurant_Focus_2}`}
            </div>
          )}
          {card.restaurant_data?.Restaurant_Focus_1 && (
            <div className="card-preview-archetype">
              {card.restaurant_data.Restaurant_Focus_1}
            </div>
          )}
          {card.meal_data?.food_type && (
            <div className="card-preview-archetype">
              {card.meal_data.food_type}
            </div>
          )}
          {card.staff_data?.employee_type && (
            <div className="card-preview-archetype">
              {card.staff_data.employee_type}
            </div>
          )}
          <p className="card-preview-description">{card.description || 'No description'}</p>
          {card.effect && (
            <div className="card-preview-effect">
              <strong>Effect:</strong> {card.effect}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardPreview;


