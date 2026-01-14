import React, { useState } from 'react';
import { LocalCard } from '../../services/LocalCardStorage';
import './CardList.css';

interface CardListProps {
  cards: LocalCard[];
  selectedCard: LocalCard | null;
  onCardSelect: (card: LocalCard) => void;
  onCardDelete: (cardCode: string) => void;
}

function CardList({ cards, selectedCard, onCardSelect, onCardDelete }: CardListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterExpansion, setFilterExpansion] = useState<string>('ALL');

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || card.card_type === filterType;
    const matchesExpansion = filterExpansion === 'ALL' || card.expansion === filterExpansion;
    
    return matchesSearch && matchesType && matchesExpansion;
  });

  const expansions = Array.from(new Set(cards.map(c => c.expansion))).sort();
  const cardTypes = ['ALL', 'CHEF', 'RESTAURANT', 'MEAL', 'STAFF', 'SUPPORT', 'EVENT'];

  return (
    <div className="card-list">
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
          onChange={(e) => setFilterType(e.target.value)}
          className="card-list-filter"
        >
          {cardTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filterExpansion}
          onChange={(e) => setFilterExpansion(e.target.value)}
          className="card-list-filter"
        >
          <option value="ALL">All Expansions</option>
          {expansions.map(exp => (
            <option key={exp} value={exp}>{exp}</option>
          ))}
        </select>
      </div>

      <div className="card-list-items">
        {filteredCards.length === 0 ? (
          <div className="card-list-empty">
            <p>No cards found</p>
          </div>
        ) : (
          filteredCards.map(card => (
            <div
              key={card.code || Math.random()}
              className={`card-list-item ${selectedCard?.code === card.code ? 'selected' : ''} ${!card.synced ? 'unsynced' : ''}`}
              onClick={() => onCardSelect(card)}
            >
              <div className="card-list-item-header">
                <span className="card-list-item-code">{card.code || 'NEW'}</span>
                {!card.synced && <span className="card-list-item-sync-badge">●</span>}
              </div>
              <div className="card-list-item-name">{card.name || 'Unnamed Card'}</div>
              <div className="card-list-item-type">{card.card_type}</div>
              <button
                className="card-list-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardDelete(card.code);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CardList;


