import React, { useState } from 'react';
import { LocalCard, CardType } from '../../types/Card';
import './CardList.css';

interface CardListProps {
  cards: LocalCard[];
  selectedCard: LocalCard | null;
  onCardSelect: (card: LocalCard) => void;
  onCardDelete: (cardCode: string) => void;
}

function CardList({ cards, selectedCard, onCardSelect, onCardDelete }: CardListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || card.card_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (e: React.MouseEvent, cardCode: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete card ${cardCode}?`)) {
      onCardDelete(cardCode);
    }
  };

  return (
    <div className="card-list">
      <div className="card-list-header">
        <h2>Cards ({cards.length})</h2>
      </div>

      <div className="card-list-filters">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="card-list-search"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CardType | 'ALL')}
          className="card-list-type-filter"
        >
          <option value="ALL">All Types</option>
          <option value="CHEF">Chef</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="MEAL">Meal</option>
          <option value="STAFF">Staff</option>
          <option value="SUPPORT">Support</option>
          <option value="EVENT">Event</option>
        </select>
      </div>

      <div className="card-list-items">
        {filteredCards.length === 0 ? (
          <div className="card-list-empty">
            {cards.length === 0 ? 'No cards yet' : 'No cards match your search'}
          </div>
        ) : (
          filteredCards.map(card => (
            <div
              key={card.code}
              className={`card-list-item ${selectedCard?.code === card.code ? 'selected' : ''}`}
              onClick={() => onCardSelect(card)}
            >
              <div className="card-list-item-header">
                <span className="card-list-item-name">{card.name || 'Unnamed Card'}</span>
                <span className="card-list-item-type">{card.card_type}</span>
              </div>
              <div className="card-list-item-code">{card.code}</div>
              {card.description && (
                <div className="card-list-item-description">{card.description}</div>
              )}
              <button
                className="card-list-item-delete"
                onClick={(e) => handleDelete(e, card.code)}
                title="Delete card"
              >
                ×
              </button>
              {card.synced && (
                <span className="card-list-item-synced" title="Synced to Supabase">✓</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CardList;

