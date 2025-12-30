-- Chef Card Game Database Schema
-- Run this in your Supabase SQL Editor

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_id ON games(id);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_game_player ON players(game_id, player_id);

-- Enable Row Level Security (optional, adjust based on your security needs)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write
-- NOTE: For production, you should implement proper authentication
CREATE POLICY "Games are publicly readable" ON games FOR SELECT USING (true);
CREATE POLICY "Games are publicly writable" ON games FOR ALL USING (true);

CREATE POLICY "Players are publicly readable" ON players FOR SELECT USING (true);
CREATE POLICY "Players are publicly writable" ON players FOR ALL USING (true);

-- Enable Realtime for both tables
-- This allows real-time subscriptions to changes
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

