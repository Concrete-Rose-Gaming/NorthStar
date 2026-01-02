import React, { useState, useEffect } from 'react';
import { SavedDeck, getUserDecks, saveDeck, deleteDeck, exportDeck, importDeck } from '../../supabase/decks';
import { PlayerDeck } from '../../game/DeckManager';
import './DeckManager.css';

interface DeckManagerProps {
  currentDeck?: PlayerDeck;
  onLoadDeck: (deck: PlayerDeck) => void;
  onClose: () => void;
}

export function DeckManager({ currentDeck, onLoadDeck, onClose }: DeckManagerProps) {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    setError(null);
    const { decks, error: decksError } = await getUserDecks();
    if (decksError) {
      setError(decksError.message);
    } else {
      setSavedDecks(decks);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentDeck || !saveName.trim()) {
      setError('Please enter a deck name');
      return;
    }

    setError(null);
    const { deck, error: saveError } = await saveDeck(saveName.trim(), currentDeck, editingDeckId || undefined);
    if (saveError) {
      setError(saveError.message);
    } else {
      setShowSaveDialog(false);
      setSaveName('');
      setEditingDeckId(null);
      loadDecks();
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    setError(null);
    const { error: deleteError } = await deleteDeck(deckId);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      loadDecks();
    }
  };

  const handleExport = (deck: SavedDeck) => {
    const json = exportDeck(deck.deck, deck.name);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setError('Please paste a deck JSON');
      return;
    }

    const { name, deck, error: importError } = importDeck(importText);
    if (importError) {
      setError(importError.message);
    } else {
      onLoadDeck(deck);
      setShowImport(false);
      setImportText('');
      onClose();
    }
  };

  const handleLoad = (deck: SavedDeck) => {
    onLoadDeck(deck.deck);
    onClose();
  };

  return (
    <div className="deck-manager-overlay" onClick={onClose}>
      <div className="deck-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deck-manager-header">
          <h2>Deck Manager</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="deck-manager-error">{error}</div>}

        <div className="deck-manager-tabs">
          <button
            className={`tab-button ${!showImport ? 'active' : ''}`}
            onClick={() => setShowImport(false)}
          >
            My Decks
          </button>
          <button
            className={`tab-button ${showImport ? 'active' : ''}`}
            onClick={() => setShowImport(true)}
          >
            Import Deck
          </button>
        </div>

        {showImport ? (
          <div className="deck-manager-content">
            <div className="import-section">
              <label>Paste deck JSON:</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"name": "My Deck", "deck": {...}}'
                rows={10}
              />
              <button className="action-button" onClick={handleImport}>
                Import Deck
              </button>
            </div>
          </div>
        ) : (
          <div className="deck-manager-content">
            {currentDeck && (
              <div className="save-section">
                <button
                  className="action-button primary"
                  onClick={() => {
                    setShowSaveDialog(true);
                    setSaveName('');
                    setEditingDeckId(null);
                  }}
                >
                  Save Current Deck
                </button>
              </div>
            )}

            {showSaveDialog && (
              <div className="save-dialog">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Deck name"
                  autoFocus
                />
                <div className="save-dialog-actions">
                  <button className="action-button" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="action-button secondary"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading decks...</div>
            ) : savedDecks.length === 0 ? (
              <div className="empty-state">No saved decks yet</div>
            ) : (
              <div className="decks-list">
                {savedDecks.map((deck) => (
                  <div key={deck.id} className="deck-item">
                    <div className="deck-info">
                      <h3>{deck.name}</h3>
                      <p className="deck-meta">
                        Updated: {new Date(deck.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="deck-actions">
                      <button
                        className="action-button small"
                        onClick={() => handleLoad(deck)}
                      >
                        Load
                      </button>
                      <button
                        className="action-button small"
                        onClick={() => {
                          setSaveName(deck.name);
                          setEditingDeckId(deck.id);
                          setShowSaveDialog(true);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="action-button small"
                        onClick={() => handleExport(deck)}
                      >
                        Export
                      </button>
                      <button
                        className="action-button small danger"
                        onClick={() => handleDelete(deck.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

