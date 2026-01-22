import React, { useState, useCallback } from 'react';
import { Card } from '../Card/Card';
import { CardType, getCardsByType, ChefCard, RestaurantCard } from '../../game/CardTypes';
import { getCardRegistry } from '../../game/CardLoader';
import { PlayerDeck, validatePlayerDeck, getDeckStats, restaurantMatchesChefArchetype } from '../../game/DeckManager';
import './DeckBuilder.css';

interface DeckBuilderProps {
  onDeckComplete: (playerDeck: PlayerDeck) => void;
  initialDeck?: PlayerDeck;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  onDeckComplete,
  initialDeck
}) => {
  const [chefCardId, setChefCardId] = useState<string>(initialDeck?.chefCardId || '');
  const [restaurantCardIds, setRestaurantCardIds] = useState<string[]>(initialDeck?.restaurantCardIds || []);
  const [mainDeck, setMainDeck] = useState<string[]>(initialDeck?.mainDeck || []);
  const [selectedType, setSelectedType] = useState<CardType | 'MAIN_DECK'>('MAIN_DECK');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'chef' | 'restaurants' | 'main'>('chef');

  const mainDeckStats = getDeckStats(mainDeck);

  const handleSelectChef = (cardId: string) => {
    const registry = getCardRegistry();
    const newChef = registry[cardId] as ChefCard | undefined;
    
    if (!newChef || newChef.type !== CardType.CHEF) {
      return;
    }
    
    // If restaurants are already selected, check if they match the new chef
    // Remove restaurants that don't match the new chef
    const matchingRestaurantIds = restaurantCardIds.filter(restaurantId => {
      const restaurant = registry[restaurantId] as RestaurantCard | undefined;
      if (!restaurant) return false;
      return restaurantMatchesChefArchetype(restaurant, newChef);
    });
    
    setChefCardId(cardId);
    if (matchingRestaurantIds.length !== restaurantCardIds.length) {
      setRestaurantCardIds(matchingRestaurantIds);
    }
    validateDeck();
  };

  const handleSelectRestaurant = (cardId: string) => {
    const registry = getCardRegistry();
    const restaurant = registry[cardId] as RestaurantCard | undefined;
    
    if (!restaurant || restaurant.type !== CardType.RESTAURANT) {
      return;
    }
    
    // If a chef is selected, check if the restaurant matches
    if (chefCardId) {
      const chef = registry[chefCardId] as ChefCard | undefined;
      if (chef && !restaurantMatchesChefArchetype(restaurant, chef)) {
        // Restaurant doesn't match chef, don't allow selection
        return;
      }
    }
    
    if (restaurantCardIds.includes(cardId)) {
      // Remove if already selected
      setRestaurantCardIds(restaurantCardIds.filter(id => id !== cardId));
    } else if (restaurantCardIds.length < 3) {
      // Add if less than 3 selected
      setRestaurantCardIds([...restaurantCardIds, cardId]);
    }
    validateDeck();
  };

  const handleAddToMainDeck = (cardId: string) => {
    const registry = getCardRegistry();
    const card = registry[cardId];
    if (!card) return;
    
    // Don't allow Chef or Restaurant cards in main deck
    if (card.type === CardType.CHEF || card.type === CardType.RESTAURANT) {
      return;
    }

    const newDeck = [...mainDeck, cardId];
    setMainDeck(newDeck);
    validateDeck();
  };

  const handleRemoveFromMainDeck = (cardId: string) => {
    const index = mainDeck.indexOf(cardId);
    if (index > -1) {
      const newDeck = [...mainDeck];
      newDeck.splice(index, 1);
      setMainDeck(newDeck);
      validateDeck();
    }
  };

  const validateDeck = useCallback(() => {
    const playerDeck: PlayerDeck = {
      mainDeck,
      chefCardId,
      restaurantCardIds
    };
    const result = validatePlayerDeck(playerDeck);
    setValidationResult(result);
  }, [mainDeck, chefCardId, restaurantCardIds]);

  const getCardCount = (cardId: string) => {
    return mainDeck.filter(id => id === cardId).length;
  };

  const handleFinish = () => {
    const playerDeck: PlayerDeck = {
      mainDeck,
      chefCardId,
      restaurantCardIds
    };
    const result = validatePlayerDeck(playerDeck);
    if (result.isValid) {
      onDeckComplete(playerDeck);
    } else {
      setValidationResult(result);
    }
  };

  const getAvailableCards = () => {
    const registry = getCardRegistry();
    
    if (activeSection === 'chef') {
      let chefs = getCardsByType(CardType.CHEF) as ChefCard[];
      
      // If restaurants are selected, filter chefs to only show those that match restaurant archetypes
      if (restaurantCardIds.length > 0) {
        // Get all unique archetypes from selected restaurants
        const selectedRestaurantArchetypes = new Set<string>();
        restaurantCardIds.forEach(restaurantId => {
          const restaurant = registry[restaurantId] as RestaurantCard | undefined;
          if (restaurant?.primaryArchetype) {
            selectedRestaurantArchetypes.add(restaurant.primaryArchetype);
          }
        });
        
        // Filter chefs: only show chefs whose primary or secondary archetype matches any selected restaurant archetype
        if (selectedRestaurantArchetypes.size > 0) {
          chefs = chefs.filter(chef => {
            const chefArchetypes = [chef.primaryArchetype];
            if (chef.secondaryArchetype) {
              chefArchetypes.push(chef.secondaryArchetype);
            }
            // Chef matches if any of its archetypes match any selected restaurant archetype
            return chefArchetypes.some(arch => selectedRestaurantArchetypes.has(arch));
          });
        }
      }
      
      return chefs;
    } else if (activeSection === 'restaurants') {
      let restaurants = getCardsByType(CardType.RESTAURANT) as RestaurantCard[];
      
      // If a chef is selected, filter restaurants to only show those that match chef archetypes
      if (chefCardId) {
        const chef = registry[chefCardId] as ChefCard | undefined;
        if (chef) {
          restaurants = restaurants.filter(restaurant => 
            restaurantMatchesChefArchetype(restaurant, chef)
          );
        }
      }
      
      return restaurants;
    } else {
      // Main deck - only Meals, Staff, Support, Event
      if (selectedType === 'MAIN_DECK') {
        return Object.values(registry).filter(card => 
          card.type !== CardType.CHEF && card.type !== CardType.RESTAURANT
        );
      }
      return getCardsByType(selectedType).filter(card => 
        card.type !== CardType.CHEF && card.type !== CardType.RESTAURANT
      );
    }
  };

  React.useEffect(() => {
    validateDeck();
  }, [validateDeck]);

  return (
    <div className="deck-builder">
      <h2>Deck Builder</h2>
      
      <div className="deck-stats">
        <div className="stat-item">
          <strong>Chef:</strong> {chefCardId ? '✓ Selected' : 'Not selected'} / 1
        </div>
        <div className="stat-item">
          <strong>Restaurants:</strong> {restaurantCardIds.length} / 3
        </div>
        <div className="stat-item">
          <strong>Main Deck:</strong> {mainDeck.length} / 30
        </div>
        <div className="stat-item">
          <strong>Meals:</strong> {mainDeckStats.mealCount}
        </div>
        <div className="stat-item">
          <strong>Staff:</strong> {mainDeckStats.staffCount}
        </div>
        <div className="stat-item">
          <strong>Support:</strong> {mainDeckStats.supportCount}
        </div>
        <div className="stat-item">
          <strong>Events:</strong> {mainDeckStats.eventCount}
        </div>
      </div>

      {validationResult && (
        <div className={`validation-result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
          {validationResult.errors.length > 0 && (
            <div className="errors">
              <strong>Errors:</strong>
              <ul>
                {validationResult.errors.map((error: string, i: number) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {validationResult.warnings.length > 0 && (
            <div className="warnings">
              <strong>Warnings:</strong>
              <ul>
                {validationResult.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="section-tabs">
        <button
          className={activeSection === 'chef' ? 'active' : ''}
          onClick={() => setActiveSection('chef')}
        >
          Select Chef (1)
        </button>
        <button
          className={activeSection === 'restaurants' ? 'active' : ''}
          onClick={() => setActiveSection('restaurants')}
        >
          Select Restaurants (3)
        </button>
        <button
          className={activeSection === 'main' ? 'active' : ''}
          onClick={() => setActiveSection('main')}
        >
          Build Main Deck (30)
        </button>
      </div>

      <div className="deck-builder-content">
        {activeSection === 'chef' && (
          <div className="chef-selection">
            <h3>Select Your Chef Card</h3>
            {restaurantCardIds.length > 0 && (
              <div className="archetype-filter-notice">
                <p>Only chefs matching your selected restaurant archetypes are shown.</p>
              </div>
            )}
            <div className="cards-grid">
              {getAvailableCards().map(card => (
                <div key={card.id} className="library-card-wrapper">
                  <Card
                    card={card}
                    size="medium"
                    onClick={() => handleSelectChef(card.id)}
                    selected={chefCardId === card.id}
                  />
                </div>
              ))}
            </div>
            {chefCardId && (() => {
              const registry = getCardRegistry();
              const chefCard = registry[chefCardId];
              if (!chefCard) return null;
              return (
                <div className="selected-chef">
                  <h4>Selected Chef:</h4>
                  <Card card={chefCard} size="medium" />
                </div>
              );
            })()}
          </div>
        )}

        {activeSection === 'restaurants' && (
          <div className="restaurants-selection">
            <h3>Select Your 3 Restaurant Cards</h3>
            {chefCardId && (
              <div className="archetype-filter-notice">
                <p>Only restaurants matching your chef's archetype are shown.</p>
              </div>
            )}
            {!chefCardId && (
              <div className="archetype-filter-notice warning">
                <p>Select a chef first to see matching restaurants.</p>
              </div>
            )}
            <div className="cards-grid">
              {getAvailableCards().map(card => {
                const isSelected = restaurantCardIds.includes(card.id);
                return (
                  <div key={card.id} className="library-card-wrapper">
                    <Card
                      card={card}
                      size="medium"
                      onClick={() => handleSelectRestaurant(card.id)}
                      selected={isSelected}
                      disabled={!isSelected && restaurantCardIds.length >= 3}
                    />
                    {isSelected && <div className="selected-badge">Selected</div>}
                  </div>
                );
              })}
            </div>
            {restaurantCardIds.length > 0 && (
              <div className="selected-restaurants">
                <h4>Selected Restaurants ({restaurantCardIds.length}/3):</h4>
                <div className="cards-row">
                  {restaurantCardIds.map(cardId => {
                    const registry = getCardRegistry();
                    const card = registry[cardId];
                    return card ? <Card key={cardId} card={card} size="small" /> : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'main' && (
          <>
            <div className="card-library">
              <div className="type-filter">
                <button
                  className={selectedType === 'MAIN_DECK' ? 'active' : ''}
                  onClick={() => setSelectedType('MAIN_DECK')}
                >
                  All Main Deck Cards
                </button>
                {[CardType.MEAL, CardType.STAFF, CardType.SUPPORT, CardType.EVENT].map(type => (
                  <button
                    key={type}
                    className={selectedType === type ? 'active' : ''}
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="cards-grid">
                {getAvailableCards().map(card => {
                  const count = getCardCount(card.id);
                  const maxReached = count >= 3;

                  return (
                    <div key={card.id} className="library-card-wrapper">
                      <Card
                        card={card}
                        size="small"
                        onClick={() => !maxReached && handleAddToMainDeck(card.id)}
                        disabled={maxReached}
                      />
                      <div className="card-count">
                        In deck: {count} / 3
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="current-deck">
              <h3>Main Deck ({mainDeck.length} / 30 cards)</h3>
              <div className="deck-list">
                {Object.entries(getDeckStats(mainDeck).cardCounts).map(([cardId, count]) => {
                  const registry = getCardRegistry();
                  const card = registry[cardId];
                  if (!card) return null;
                  const cardTypeClass = `deck-item-${card.type.toLowerCase()}`;
                  return (
                    <div key={cardId} className={`deck-item ${cardTypeClass}`}>
                      <span>{card.name} x{count}</span>
                      <button onClick={() => handleRemoveFromMainDeck(cardId)}>Remove</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="deck-builder-footer">
        <button
          className="finish-button"
          onClick={handleFinish}
          disabled={!validationResult?.isValid}
        >
          Finish Deck
        </button>
      </div>
    </div>
  );
};
