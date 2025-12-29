import { Card, AnyCard, CardType, CardZone } from '@culinary-game/shared';

export class CardSystem {
  private cardDatabase: Map<string, Card> = new Map();

  constructor() {
    this.initializeCardDatabase();
  }

  private initializeCardDatabase() {
    // Sample Chef cards
    this.addCard({
      id: 'chef-001',
      name: 'Master Chef Gordon',
      type: CardType.CHEF,
      description: 'A legendary chef with unmatched culinary skills',
      health: 30,
      attack: 5,
      abilities: [
        {
          id: 'ability-001',
          name: 'Culinary Mastery',
          description: 'Gain +1 legendary star when winning Head-to-Head',
          effect: 'BONUS_STAR'
        }
      ]
    });

    this.addCard({
      id: 'chef-002',
      name: 'Sous Chef Maria',
      type: CardType.CHEF,
      description: 'A skilled sous chef with defensive abilities',
      health: 35,
      attack: 4,
      abilities: [
        {
          id: 'ability-002',
          name: 'Defensive Stance',
          description: 'Reduce incoming damage by 2',
          effect: 'REDUCE_DAMAGE'
        }
      ]
    });

    // Sample Restaurant cards
    this.addCard({
      id: 'restaurant-001',
      name: 'The Golden Spoon',
      type: CardType.RESTAURANT,
      description: 'A prestigious restaurant that attracts high-end customers',
      effects: [
        {
          id: 'effect-001',
          name: 'Prestige',
          description: 'When you have 3+ legendary stars, draw an extra card each turn',
          effect: 'DRAW_CARD'
        }
      ]
    });

    this.addCard({
      id: 'restaurant-002',
      name: 'The Cozy Corner',
      type: CardType.RESTAURANT,
      description: 'A welcoming neighborhood restaurant',
      effects: [
        {
          id: 'effect-002',
          name: 'Community Support',
          description: 'Start with +1 health on your Chef',
          effect: 'BONUS_HEALTH'
        }
      ]
    });

    this.addCard({
      id: 'restaurant-003',
      name: 'The Fusion Kitchen',
      type: CardType.RESTAURANT,
      description: 'Innovative cuisine combining different cultures',
      effects: [
        {
          id: 'effect-003',
          name: 'Innovation',
          description: 'Your Chef gains +1 attack',
          effect: 'BONUS_ATTACK'
        }
      ]
    });

    // Sample Dish cards
    this.addCard({
      id: 'dish-001',
      name: 'Signature Pasta',
      type: CardType.DISH,
      description: 'A delicious pasta dish that boosts morale',
      effects: [
        {
          id: 'effect-004',
          name: 'Morale Boost',
          description: 'Heal your Chef for 5 health',
          effect: 'HEAL_CHEF'
        }
      ]
    });

    this.addCard({
      id: 'dish-002',
      name: 'Gourmet Burger',
      type: CardType.DISH,
      description: 'A hearty burger that increases attack',
      effects: [
        {
          id: 'effect-005',
          name: 'Power Meal',
          description: 'Your Chef gains +2 attack this turn',
          effect: 'BOOST_ATTACK'
        }
      ]
    });

    // Sample Character cards
    this.addCard({
      id: 'character-001',
      name: 'Expert Waiter',
      type: CardType.CHARACTER,
      description: 'A skilled waiter who improves service',
      role: 'WAITER',
      effects: [
        {
          id: 'effect-006',
          name: 'Efficient Service',
          description: 'Draw a card when played',
          effect: 'DRAW_CARD'
        }
      ]
    });

    this.addCard({
      id: 'character-002',
      name: 'Celebrity Chef',
      type: CardType.CHARACTER,
      description: 'A famous chef who brings attention',
      role: 'LEGENDARY_CHEF',
      effects: [
        {
          id: 'effect-007',
          name: 'Star Power',
          description: 'If you have 2+ legendary stars, gain +1 legendary star',
          effect: 'GAIN_STAR',
          activationCondition: {
            type: 'STAR_COUNT',
            value: 2
          }
        }
      ]
    });

    this.addCard({
      id: 'character-003',
      name: 'Restaurant Critic',
      type: CardType.CHARACTER,
      description: 'An influential critic',
      role: 'ACTOR',
      effects: [
        {
          id: 'effect-008',
          name: 'Influence',
          description: 'Opponent loses 1 legendary star',
          effect: 'REMOVE_STAR'
        }
      ]
    });
  }

  private addCard(card: AnyCard) {
    this.cardDatabase.set(card.id, card);
  }

  getCard(id: string): Card | undefined {
    return this.cardDatabase.get(id);
  }

  getAllCards(): Card[] {
    return Array.from(this.cardDatabase.values());
  }

  getCardsByType(type: CardType): Card[] {
    return Array.from(this.cardDatabase.values()).filter(card => card.type === type);
  }

  getRandomRestaurants(count: number = 3): Card[] {
    const restaurants = this.getCardsByType(CardType.RESTAURANT);
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, restaurants.length));
  }

  createDeck(cardIds: string[]): AnyCard[] {
    const deck: AnyCard[] = [];
    for (const cardId of cardIds) {
      const card = this.getCard(cardId);
      if (card) {
        deck.push(card as AnyCard);
      }
    }
    return deck;
  }

  validateDeck(deck: AnyCard[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (deck.length !== 30) {
      errors.push(`Deck must contain exactly 30 cards, found ${deck.length}`);
    }

    // Check for max 3 copies per card
    const cardCounts = new Map<string, number>();
    for (const card of deck) {
      const count = cardCounts.get(card.id) || 0;
      cardCounts.set(card.id, count + 1);
      if (count + 1 > 3) {
        errors.push(`Card ${card.name} appears more than 3 times`);
      }
    }

    // Check for Chef card
    const hasChef = deck.some(card => card.type === CardType.CHEF);
    if (!hasChef) {
      errors.push('Deck must contain at least one Chef card');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  shuffleDeck(deck: AnyCard[]): AnyCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCards(deck: AnyCard[], count: number): { drawn: AnyCard[]; remaining: AnyCard[] } {
    const drawn = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { drawn, remaining };
  }
}

