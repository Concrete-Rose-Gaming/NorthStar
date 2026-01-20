-- Migration: Add Influence Fields to Feeder Tables
-- This migration adds only the influence-related columns.
-- Archetype columns already exist in the feeder tables.

-- Add influence fields to chef_cards table
ALTER TABLE chef_cards
ADD COLUMN IF NOT EXISTS starting_influence INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS star_bonus_influence INTEGER DEFAULT 1;

-- Add influence_cost to meal_cards table
ALTER TABLE meal_cards
ADD COLUMN IF NOT EXISTS influence_cost INTEGER DEFAULT 1;

-- Add influence_cost to staff_cards table
ALTER TABLE staff_cards
ADD COLUMN IF NOT EXISTS influence_cost INTEGER DEFAULT 2;

-- Add influence_cost to event_cards table
ALTER TABLE event_cards
ADD COLUMN IF NOT EXISTS influence_cost INTEGER DEFAULT 2;

-- Add comments for documentation
COMMENT ON COLUMN chef_cards.starting_influence IS 'Base influence the chef provides at game start';
COMMENT ON COLUMN chef_cards.star_bonus_influence IS 'Bonus influence per star the chef earns';
COMMENT ON COLUMN meal_cards.influence_cost IS 'Influence cost to play this meal card';
COMMENT ON COLUMN staff_cards.influence_cost IS 'Influence cost to play this staff card';
COMMENT ON COLUMN event_cards.influence_cost IS 'Influence cost to play this event card';
