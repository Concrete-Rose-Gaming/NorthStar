// Core game type definitions

export enum CardType {
  CHEF = 'CHEF',
  RESTAURANT = 'RESTAURANT',
  DISH = 'DISH',
  CHARACTER = 'CHARACTER'
}

export enum GamePhase {
  SETUP = 'SETUP',
  MULLIGAN = 'MULLIGAN',
  ROUND = 'ROUND',
  HEAD_TO_HEAD = 'HEAD_TO_HEAD',
  VICTORY = 'VICTORY'
}

export enum CardZone {
  DECK = 'DECK',
  HAND = 'HAND',
  BOARD = 'BOARD',
  DISCARD = 'DISCARD'
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  abilities?: CardAbility[];
  activationCondition?: ActivationCondition;
}

export interface CardAbility {
  id: string;
  name: string;
  description: string;
  effect: string; // Effect identifier or description
}

export interface ActivationCondition {
  type: 'STAR_COUNT' | 'CARD_PLAYED' | 'TURN' | 'COMBAT' | 'NONE';
  value?: number; // For STAR_COUNT, minimum stars required
  cardType?: CardType;
}

export interface ChefCard extends Card {
  type: CardType.CHEF;
  health: number;
  attack: number;
  abilities: CardAbility[];
}

export interface RestaurantCard extends Card {
  type: CardType.RESTAURANT;
  effects?: CardAbility[];
}

export interface DishCard extends Card {
  type: CardType.DISH;
  cost?: number;
  effects?: CardAbility[];
}

export interface CharacterCard extends Card {
  type: CardType.CHARACTER;
  role: 'WAITER' | 'LEGENDARY_CHEF' | 'ACTOR' | 'INVESTOR' | 'OTHER';
  effects?: CardAbility[];
}

export type AnyCard = ChefCard | RestaurantCard | DishCard | CharacterCard;

export interface Player {
  id: string;
  username: string;
  chef: ChefCard | null;
  restaurants: RestaurantCard[];
  hand: AnyCard[];
  deck: AnyCard[];
  discard: AnyCard[];
  board: AnyCard[]; // Cards in play
  legendaryStars: number;
  isReady: boolean;
  isAI: boolean;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  roundNumber: number;
  turnOrder: number[]; // Player indices in turn order
  legendaryStarsPool: number; // Total stars available (5 to win)
  winner: string | null;
  createdAt: Date;
  lastUpdated: Date;
}

export interface GameAction {
  type: 'PLAY_CARD' | 'END_TURN' | 'MULLIGAN' | 'HEAD_TO_HEAD' | 'ACTIVATE_ABILITY';
  playerId: string;
  cardId?: string;
  targetId?: string;
  data?: any;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  targetId: string;
  targetName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  roomId?: string;
}

export interface LobbyPlayer {
  id: string;
  username: string;
  isOnline: boolean;
  isInGame: boolean;
  currentGameId?: string;
}

