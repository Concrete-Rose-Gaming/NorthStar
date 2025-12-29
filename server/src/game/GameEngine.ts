import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GamePhase,
  Player,
  GameAction,
  AnyCard,
  CardType,
  ChefCard
} from '@culinary-game/shared';
import { CardSystem } from './CardSystem';

export class GameEngine {
  private cardSystem: CardSystem;
  private gameState: GameState;

  constructor(cardSystem: CardSystem) {
    this.cardSystem = cardSystem;
    this.gameState = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      id: uuidv4(),
      phase: GamePhase.SETUP,
      players: [],
      currentPlayerIndex: 0,
      roundNumber: 0,
      turnOrder: [],
      legendaryStarsPool: 5,
      winner: null,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  initializeGame(playerIds: string[], playerUsernames: string[], isAI: boolean[] = [false, false]): GameState {
    // Create players
    const players: Player[] = [];
    
    for (let i = 0; i < playerIds.length; i++) {
      const player: Player = {
        id: playerIds[i],
        username: playerUsernames[i],
        chef: null,
        restaurants: [],
        hand: [],
        deck: [],
        discard: [],
        board: [],
        legendaryStars: 0,
        isReady: false,
        isAI: isAI[i] || false
      };
      players.push(player);
    }

    // Assign random restaurants (3 per player)
    for (const player of players) {
      const restaurants = this.cardSystem.getRandomRestaurants(3);
      player.restaurants = restaurants as any[];
    }

    // Create starter decks (for prototype, use predefined decks)
    for (const player of players) {
      const deck = this.createStarterDeck();
      player.deck = this.cardSystem.shuffleDeck(deck);
    }

    // Coin toss for turn order
    const turnOrder = [0, 1].sort(() => Math.random() - 0.5);

    this.gameState = {
      ...this.gameState,
      players,
      turnOrder,
      phase: GamePhase.SETUP,
      currentPlayerIndex: turnOrder[0]
    };

    // Deal initial hands
    this.dealInitialHands();

    // Move to mulligan phase
    this.gameState.phase = GamePhase.MULLIGAN;

    return this.getState();
  }

  private createStarterDeck(): AnyCard[] {
    // Create a basic starter deck for prototype
    const deck: string[] = [];
    
    // Add 1 Chef
    deck.push('chef-001');
    
    // Add 3 copies of each dish (9 total)
    for (let i = 0; i < 3; i++) {
      deck.push('dish-001', 'dish-002');
    }
    
    // Add 3 copies of each character (9 total)
    for (let i = 0; i < 3; i++) {
      deck.push('character-001', 'character-002', 'character-003');
    }
    
    // Fill remaining slots with more cards to reach 30
    while (deck.length < 30) {
      deck.push('dish-001', 'character-001');
    }
    
    return this.cardSystem.createDeck(deck.slice(0, 30));
  }

  private dealInitialHands() {
    for (const player of this.gameState.players) {
      const { drawn, remaining } = this.cardSystem.drawCards(player.deck, 5);
      player.hand = drawn;
      player.deck = remaining;
    }
  }

  processAction(action: GameAction): { success: boolean; newState?: GameState; error?: string } {
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    switch (action.type) {
      case 'MULLIGAN':
        return this.handleMulligan(action.playerId);
      
      case 'PLAY_CARD':
        return this.handlePlayCard(action.playerId, action.cardId!);
      
      case 'END_TURN':
        return this.handleEndTurn(action.playerId);
      
      case 'HEAD_TO_HEAD':
        return this.handleHeadToHead();
      
      case 'ACTIVATE_ABILITY':
        return this.handleActivateAbility(action.playerId, action.cardId!, action.targetId);
      
      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  private handleMulligan(playerId: string): { success: boolean; newState?: GameState; error?: string } {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || this.gameState.phase !== GamePhase.MULLIGAN) {
      return { success: false, error: 'Invalid mulligan' };
    }

    // Shuffle hand back into deck
    player.deck = [...player.deck, ...player.hand];
    player.deck = this.cardSystem.shuffleDeck(player.deck);
    
    // Draw new hand
    const { drawn, remaining } = this.cardSystem.drawCards(player.deck, 5);
    player.hand = drawn;
    player.deck = remaining;

    player.isReady = true;

    // Check if all players are ready
    if (this.gameState.players.every(p => p.isReady)) {
      // Assign Chef cards
      for (const player of this.gameState.players) {
        const chefCard = player.hand.find(card => card.type === CardType.CHEF) as ChefCard | undefined;
        if (chefCard) {
          player.chef = chefCard;
          player.hand = player.hand.filter(card => card.id !== chefCard.id);
        } else {
          // If no Chef in hand, get one from deck
          const chefs = player.deck.filter(card => card.type === CardType.CHEF);
          if (chefs.length > 0) {
            player.chef = chefs[0] as ChefCard;
            player.deck = player.deck.filter(card => card.id !== player.chef!.id);
          }
        }
      }

      this.gameState.phase = GamePhase.ROUND;
      this.gameState.roundNumber = 1;
    }

    this.updateLastModified();
    return { success: true, newState: this.getState() };
  }

  private handlePlayCard(playerId: string, cardId: string): { success: boolean; newState?: GameState; error?: string } {
    if (this.gameState.phase !== GamePhase.ROUND) {
      return { success: false, error: 'Not in round phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || this.gameState.players[this.gameState.currentPlayerIndex].id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      return { success: false, error: 'Card not in hand' };
    }

    // Remove from hand and add to board
    player.hand = player.hand.filter(c => c.id !== cardId);
    player.board.push(card);

    // Activate card effects if any
    this.activateCardEffects(card, player);

    this.updateLastModified();
    return { success: true, newState: this.getState() };
  }

  private activateCardEffects(card: AnyCard, player: Player) {
    if (card.abilities || (card as any).effects) {
      const effects = (card as any).effects || card.abilities || [];
      for (const effect of effects) {
        this.applyEffect(effect, player);
      }
    }
  }

  private applyEffect(effect: any, player: Player) {
    // Check activation conditions
    if (effect.activationCondition) {
      const condition = effect.activationCondition;
      if (condition.type === 'STAR_COUNT' && condition.value) {
        if (player.legendaryStars < condition.value) {
          return; // Condition not met
        }
      }
    }

    // Apply effect based on effect type
    switch (effect.effect) {
      case 'DRAW_CARD':
        if (player.deck.length > 0) {
          const { drawn, remaining } = this.cardSystem.drawCards(player.deck, 1);
          player.hand.push(...drawn);
          player.deck = remaining;
        }
        break;
      case 'HEAL_CHEF':
        if (player.chef) {
          player.chef.health = Math.min(player.chef.health + 5, 30);
        }
        break;
      case 'BOOST_ATTACK':
        if (player.chef) {
          player.chef.attack = (player.chef.attack || 0) + 2;
        }
        break;
      case 'GAIN_STAR':
        if (this.gameState.legendaryStarsPool > 0) {
          player.legendaryStars++;
          this.gameState.legendaryStarsPool--;
        }
        break;
      case 'REMOVE_STAR':
        const opponent = this.gameState.players.find(p => p.id !== player.id);
        if (opponent && opponent.legendaryStars > 0) {
          opponent.legendaryStars--;
          this.gameState.legendaryStarsPool++;
        }
        break;
    }
  }

  private handleEndTurn(playerId: string): { success: boolean; newState?: GameState; error?: string } {
    if (this.gameState.phase !== GamePhase.ROUND) {
      return { success: false, error: 'Not in round phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || this.gameState.players[this.gameState.currentPlayerIndex].id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Move to next player
    const currentIndex = this.gameState.currentPlayerIndex;
    const turnOrderIndex = this.gameState.turnOrder.indexOf(currentIndex);
    const nextTurnOrderIndex = (turnOrderIndex + 1) % this.gameState.turnOrder.length;

    if (nextTurnOrderIndex === 0) {
      // Round complete, trigger Head-to-Head
      this.gameState.phase = GamePhase.HEAD_TO_HEAD;
      this.handleHeadToHead();
    } else {
      this.gameState.currentPlayerIndex = this.gameState.turnOrder[nextTurnOrderIndex];
    }

    this.updateLastModified();
    return { success: true, newState: this.getState() };
  }

  private handleHeadToHead(): { success: boolean; newState?: GameState; error?: string } {
    if (this.gameState.phase !== GamePhase.HEAD_TO_HEAD) {
      return { success: false, error: 'Not in head-to-head phase' };
    }

    const [player1, player2] = this.gameState.players;
    if (!player1.chef || !player2.chef) {
      return { success: false, error: 'Players must have Chef cards' };
    }

    // Calculate combat
    const p1Attack = player1.chef.attack || 0;
    const p2Attack = player2.chef.attack || 0;

    // Apply damage
    player1.chef.health -= p2Attack;
    player2.chef.health -= p1Attack;

    // Determine winner of Head-to-Head
    let winner: Player | null = null;
    if (player1.chef.health > 0 && player2.chef.health <= 0) {
      winner = player1;
    } else if (player2.chef.health > 0 && player1.chef.health <= 0) {
      winner = player2;
    } else if (player1.chef.health > player2.chef.health) {
      winner = player1;
    } else if (player2.chef.health < player1.chef.health) {
      winner = player2;
    }

    // Award legendary star
    if (winner && this.gameState.legendaryStarsPool > 0) {
      winner.legendaryStars++;
      this.gameState.legendaryStarsPool--;

      // Check for Chef ability bonus
      if (winner.chef) {
        const bonusStarAbility = winner.chef.abilities?.find(a => a.effect === 'BONUS_STAR');
        if (bonusStarAbility && this.gameState.legendaryStarsPool > 0) {
          winner.legendaryStars++;
          this.gameState.legendaryStarsPool--;
        }
      }
    }

    // Check for game victory
    if (player1.legendaryStars >= 5) {
      this.gameState.winner = player1.id;
      this.gameState.phase = GamePhase.VICTORY;
    } else if (player2.legendaryStars >= 5) {
      this.gameState.winner = player2.id;
      this.gameState.phase = GamePhase.VICTORY;
    } else {
      // Start new round
      this.gameState.roundNumber++;
      this.gameState.phase = GamePhase.ROUND;
      this.gameState.currentPlayerIndex = this.gameState.turnOrder[0];

      // Draw cards for new round
      for (const player of this.gameState.players) {
        if (player.deck.length > 0) {
          const { drawn, remaining } = this.cardSystem.drawCards(player.deck, 1);
          player.hand.push(...drawn);
          player.deck = remaining;
        }
      }
    }

    this.updateLastModified();
    return { success: true, newState: this.getState() };
  }

  private handleActivateAbility(playerId: string, cardId: string, targetId?: string): { success: boolean; newState?: GameState; error?: string } {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const card = [...player.hand, ...player.board].find(c => c.id === cardId);
    if (!card) {
      return { success: false, error: 'Card not found' };
    }

    this.activateCardEffects(card, player);

    this.updateLastModified();
    return { success: true, newState: this.getState() };
  }

  getState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }

  private updateLastModified() {
    this.gameState.lastUpdated = new Date();
  }
}

