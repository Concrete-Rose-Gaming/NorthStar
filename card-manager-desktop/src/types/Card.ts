// Card type definitions matching Supabase schema

export type CardType = 'CHEF' | 'RESTAURANT' | 'MEAL' | 'STAFF' | 'SUPPORT' | 'EVENT';

// Base card interface
export interface BaseCard {
  code: string; // Format: EXPANSION-TYPE-NUMBER
  expansion: string;
  card_type: CardType;
  card_number: number;
  name: string;
  description: string;
  effect: string | null;
  value: number | null;
  card_art: string | null; // URL to image in Supabase storage
  rarity: string | null;
  worth: number;
  created_at?: string;
  updated_at?: string;
}

// Type-specific data interfaces
export interface ChefData {
  code: string;
  starting_influence?: number;
  star_bonus_influence?: number;
  Restaurant_Focus_1?: string; // Primary archetype
  Restaurant_Focus_2?: string; // Secondary archetype (if dual)
}

export interface RestaurantData {
  code: string;
  Restaurant_Focus_1?: string; // Primary archetype
  Restaurant_Focus_2?: string; // Secondary archetype (if dual)
  required_stars?: number; // Minimum star ranking required for effect to activate
}

export interface MealData {
  code: string;
  food_type?: string;
  influence_cost?: number;
  restaurant_type_1?: string;
  restaurant_type_2?: string;
}

export interface StaffData {
  code: string;
  employee_type?: string;
  influence_cost?: number;
  restaurant_type?: string;
  second_enum?: string;
}

export interface EventData {
  code: string;
  influence_cost?: number;
  first_enum?: string;
  second_enum?: string;
}

// Full card interface with type-specific data
export interface Card extends BaseCard {
  chef_data?: ChefData | null;
  restaurant_data?: RestaurantData | null;
  meal_data?: MealData | null;
  staff_data?: StaffData | null;
  event_data?: EventData | null;
}

// Local card storage format (includes sync status)
export interface LocalCard extends Card {
  synced?: boolean;
  lastSynced?: string | null;
  artwork_local_path?: string | null; // Local file path for preview
  artwork_synced?: boolean;
}

// Card storage file format
export interface CardStorage {
  version: string;
  lastUpdated: string;
  cards: LocalCard[];
}

