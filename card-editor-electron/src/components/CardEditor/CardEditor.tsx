import React, { useState, useEffect } from 'react';
import { LocalCardStorage, LocalCard } from '../../services/LocalCardStorage';
import { SupabaseSync } from '../../services/SupabaseSync';
import CardList from './CardList';
import CardForm from './CardForm';
import SyncStatus from './SyncStatus';
import './CardEditor.css';

function CardEditor() {
  const [cards, setCards] = useState<LocalCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<LocalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  useEffect(() => {
    loadCards();
    checkSupabaseConnection();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    const { cards: loadedCards, error } = await LocalCardStorage.loadCardsFromFile();
    if (error) {
      console.error('Failed to load cards:', error);
    } else {
      setCards(loadedCards);
    }
    setLoading(false);
  };

  const checkSupabaseConnection = async () => {
    const sync = new SupabaseSync();
    const { connected } = await sync.checkSupabaseConnection();
    setSupabaseConnected(connected);
  };

  const handleCardSelect = (card: LocalCard) => {
    setSelectedCard(card);
  };

  const handleCardSave = async (card: LocalCard, syncToSupabase: boolean = false) => {
    // Save locally
    const { success, error } = await LocalCardStorage.saveCardToFile(card);
    if (error) {
      window.alert(`Failed to save card: ${error.message}`);
      return;
    }

    // Reload cards
    await loadCards();
    setSelectedCard(card);

    // Sync to Supabase if requested
    if (syncToSupabase) {
      await handleSyncCard(card);
    }
  };

  const handleSyncCard = async (card: LocalCard) => {
    const sync = new SupabaseSync();
    const { success, error } = await sync.syncCardToSupabase(card);
    
    if (success) {
      card.synced = true;
      card.lastSynced = new Date().toISOString();
      if (card.artwork_local_path) {
        card.artwork_synced = true;
      }
      await LocalCardStorage.saveCardToFile(card);
      await loadCards();
      setSelectedCard(card);
      window.alert('Card synced to Supabase successfully!');
    } else {
      window.alert(`Failed to sync card: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleCardDelete = async (cardCode: string) => {
    if (!window.confirm(`Are you sure you want to delete card ${cardCode}?`)) {
      return;
    }

    const { success, error } = await LocalCardStorage.deleteCard(cardCode);
    if (error) {
      window.alert(`Failed to delete card: ${error.message}`);
    } else {
      await loadCards();
      if (selectedCard?.code === cardCode) {
        setSelectedCard(null);
      }
    }
  };

  const handleNewCard = () => {
    const newCard: LocalCard = {
      code: '',
      expansion: 'CORE',
      card_type: 'MEAL',
      card_number: 1,
      name: '',
      description: '',
      effect: null,
      value: null,
      card_art: null,
      rarity: null,
      worth: 0,
      synced: false,
      lastSynced: null,
      artwork_local_path: null,
      artwork_synced: false
    };
    setSelectedCard(newCard);
  };

  if (loading) {
    return (
      <div className="card-editor-loading">
        <p>Loading cards...</p>
      </div>
    );
  }

  return (
    <div className="card-editor">
      <header className="card-editor-header">
        <h1>Chef Card Editor</h1>
        <div className="card-editor-header-actions">
          <button onClick={handleNewCard} className="btn btn-primary">
            + New Card
          </button>
          <button 
            onClick={() => setShowSyncStatus(!showSyncStatus)} 
            className="btn btn-secondary"
          >
            {showSyncStatus ? 'Hide' : 'Show'} Sync Status
          </button>
          <div className={`connection-status ${supabaseConnected ? 'connected' : 'disconnected'}`}>
            {supabaseConnected ? '🟢 Connected' : '🔴 Offline'}
          </div>
        </div>
      </header>

      <div className="card-editor-content">
        <div className="card-editor-sidebar">
          <CardList
            cards={cards}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
            onCardDelete={handleCardDelete}
          />
        </div>

        <div className="card-editor-main">
          {selectedCard ? (
            <CardForm
              card={selectedCard}
              onSave={handleCardSave}
              onSync={handleSyncCard}
            />
          ) : (
            <div className="card-editor-empty">
              <p>Select a card from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {showSyncStatus && (
        <SyncStatus cards={cards} onSync={handleSyncCard} />
      )}
    </div>
  );
}

export default CardEditor;


