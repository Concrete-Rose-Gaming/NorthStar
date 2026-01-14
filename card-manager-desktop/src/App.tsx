import React, { useState, useEffect } from 'react';
import { LocalCard } from './types/Card';
import { LocalStorage } from './services/LocalStorage';
import { SupabaseService } from './services/SupabaseClient';
import CardList from './components/CardList/CardList';
import CardEditor from './components/CardEditor/CardEditor';
import Settings from './components/Settings/Settings';
import SyncStatus from './components/SyncStatus/SyncStatus';
import './App.css';

function App() {
  const [cards, setCards] = useState<LocalCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<LocalCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  useEffect(() => {
    loadCards();
    initializeSupabase();
  }, []);

  const initializeSupabase = () => {
    // Try to initialize from environment variables or localStorage
    const url = process.env.REACT_APP_SUPABASE_URL || localStorage.getItem('supabase_url');
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key');

    if (url && key) {
      SupabaseService.initialize({ url, anonKey: key });
      checkSupabaseConnection();
    }
  };

  const checkSupabaseConnection = async () => {
    const { connected } = await SupabaseService.checkConnection();
    setSupabaseConnected(connected);
  };

  const loadCards = async () => {
    setLoading(true);
    const { cards: loadedCards, error } = await LocalStorage.loadCardsFromFile();
    if (error) {
      console.error('Failed to load cards:', error);
      window.alert(`Failed to load cards: ${error.message}`);
    } else {
      setCards(loadedCards);
    }
    setLoading(false);
  };

  const handleCardSelect = (card: LocalCard) => {
    setSelectedCard(card);
  };

  const handleCardSave = async (card: LocalCard, syncToSupabase: boolean = false) => {
    // Save locally
    const { success, error } = await LocalStorage.saveCardToFile(card);
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
    if (!supabaseConnected) {
      window.alert('Supabase not connected. Please configure in Settings.');
      return;
    }

    const { success, error } = await SupabaseService.syncCardToSupabase(card);
    
    if (success) {
      card.synced = true;
      card.lastSynced = new Date().toISOString();
      if (card.card_art) {
        card.artwork_synced = true;
      }
      await LocalStorage.saveCardToFile(card);
      await loadCards();
      setSelectedCard(card);
      window.alert('Card synced to Supabase successfully!');
    } else {
      window.alert(`Failed to sync card: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleCardDelete = async (cardCode: string) => {
    const { success, error } = await LocalStorage.deleteCard(cardCode);
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

  const handleConfigSaved = () => {
    checkSupabaseConnection();
  };

  if (loading) {
    return (
      <div className="app-loading">
        <p>Loading cards...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Card Manager</h1>
        <div className="app-header-actions">
          <button onClick={handleNewCard} className="btn btn-primary">
            + New Card
          </button>
          <button 
            onClick={() => setShowSyncStatus(!showSyncStatus)} 
            className="btn btn-secondary"
          >
            {showSyncStatus ? 'Hide' : 'Show'} Sync Status
          </button>
          <button 
            onClick={() => setShowSettings(true)} 
            className="btn btn-secondary"
          >
            Settings
          </button>
          <div className={`connection-status ${supabaseConnected ? 'connected' : 'disconnected'}`}>
            {supabaseConnected ? '🟢 Connected' : '🔴 Offline'}
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className="app-sidebar">
          <CardList
            cards={cards}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
            onCardDelete={handleCardDelete}
          />
        </div>

        <div className="app-main">
          {selectedCard ? (
            <CardEditor
              card={selectedCard}
              onSave={handleCardSave}
            />
          ) : (
            <div className="app-empty">
              <p>Select a card from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {showSyncStatus && (
        <SyncStatus cards={cards} />
      )}

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConfigSaved={handleConfigSaved}
      />
    </div>
  );
}

export default App;

