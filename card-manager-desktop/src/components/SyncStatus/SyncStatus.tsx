import React from 'react';
import { LocalCard } from '../../types/Card';
import './SyncStatus.css';

interface SyncStatusProps {
  cards: LocalCard[];
}

function SyncStatus({ cards }: SyncStatusProps) {
  const syncedCount = cards.filter(c => c.synced).length;
  const totalCount = cards.length;
  const unsyncedCards = cards.filter(c => !c.synced);

  return (
    <div className="sync-status">
      <div className="sync-status-header">
        <span className="sync-status-title">Sync Status</span>
        <span className="sync-status-count">
          {syncedCount} / {totalCount} synced
        </span>
      </div>
      {unsyncedCards.length > 0 && (
        <div className="sync-status-unsynced">
          <p className="sync-status-label">Unsynced cards:</p>
          <ul className="sync-status-list">
            {unsyncedCards.map(card => (
              <li key={card.code} className="sync-status-item">
                {card.code} - {card.name || 'Unnamed'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SyncStatus;

