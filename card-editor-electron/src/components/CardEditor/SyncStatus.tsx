import React from 'react';
import { LocalCard } from '../../services/LocalCardStorage';
import './SyncStatus.css';

interface SyncStatusProps {
  cards: LocalCard[];
  onSync: (card: LocalCard) => void;
}

function SyncStatus({ cards, onSync }: SyncStatusProps) {
  const unsyncedCards = cards.filter(c => !c.synced);
  const syncedCards = cards.filter(c => c.synced);

  return (
    <div className="sync-status">
      <div className="sync-status-header">
        <h3>Sync Status</h3>
        <div className="sync-status-summary">
          <span className="sync-status-count synced">{syncedCards.length} Synced</span>
          <span className="sync-status-count unsynced">{unsyncedCards.length} Unsynced</span>
        </div>
      </div>

      {unsyncedCards.length > 0 && (
        <div className="sync-status-section">
          <h4>Unsynced Cards</h4>
          <div className="sync-status-list">
            {unsyncedCards.map(card => (
              <div key={card.code} className="sync-status-item">
                <div className="sync-status-item-info">
                  <span className="sync-status-item-code">{card.code}</span>
                  <span className="sync-status-item-name">{card.name || 'Unnamed'}</span>
                  {card.artwork_local_path && !card.artwork_synced && (
                    <span className="sync-status-item-badge">Has artwork</span>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => onSync(card)}
                >
                  Sync
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {syncedCards.length > 0 && (
        <div className="sync-status-section">
          <h4>Synced Cards</h4>
          <div className="sync-status-list">
            {syncedCards.slice(0, 10).map(card => (
              <div key={card.code} className="sync-status-item synced">
                <div className="sync-status-item-info">
                  <span className="sync-status-item-code">{card.code}</span>
                  <span className="sync-status-item-name">{card.name || 'Unnamed'}</span>
                  {card.lastSynced && (
                    <span className="sync-status-item-time">
                      Synced: {new Date(card.lastSynced).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {syncedCards.length > 10 && (
              <div className="sync-status-more">
                + {syncedCards.length - 10} more synced cards
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncStatus;


