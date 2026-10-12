-- ==============================================================================
-- Code Quest: Java Adventure - Database Schema & Security Policies
-- Supabase Postgres Schema for Leaderboard & Competition Management
-- ==============================================================================

-- 1. Enable UUID Extension (standard for Postgres & Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: leaderboard
-- Stores all player game completions, scores, badges, and breakdown details.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 15),
  score INTEGER NOT NULL DEFAULT 0,
  levels_completed INTEGER NOT NULL DEFAULT 0,
  total_levels INTEGER NOT NULL DEFAULT 12,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  instructions_used INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'competition')),
  level_details JSONB,
  verified BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on leaderboard columns
COMMENT ON TABLE leaderboard IS 'Player submissions and scores for Code Quest: Java Adventure';
COMMENT ON COLUMN leaderboard.nickname IS 'Player display name, restricted between 1 and 15 characters';
COMMENT ON COLUMN leaderboard.score IS 'Total calculated game score based on stars, levels, and efficiency';
COMMENT ON COLUMN leaderboard.total_time IS 'Overall duration spent solving levels in seconds';
COMMENT ON COLUMN leaderboard.mode IS 'Gameplay mode: practice or competition';
COMMENT ON COLUMN leaderboard.level_details IS 'JSON array containing breakdown per level (stars, moves, hints, time)';
COMMENT ON COLUMN leaderboard.verified IS 'Admin verification status for tournament integrity';
COMMENT ON COLUMN leaderboard.flagged IS 'Flagged status for suspected unfair play or rule breaches';

-- ==============================================================================
-- 3. TABLE: competition_config
-- Singleton table holding tournament parameters, rules, timers, and prizes.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS competition_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Enforces single-row singleton configuration
  competition_name TEXT DEFAULT 'Code Quest Championship',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  target_score INTEGER DEFAULT 2000,
  prize_count INTEGER DEFAULT 3,
  prizes JSONB DEFAULT '[{"place": 1, "description": "Champion Prize"}, {"place": 2, "description": "Runner-up Prize"}, {"place": 3, "description": "Third Place Prize"}]'::jsonb,
  participation_reward_enabled BOOLEAN DEFAULT TRUE,
  time_limit_seconds INTEGER DEFAULT 180,
  is_active BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE competition_config IS 'Tournament configuration settings managed via the Admin Dashboard';

-- Seed default configuration if none exists
INSERT INTO competition_config (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- Optimizes queries for leaderboard filters (fastest, high scores, stars, recency)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON leaderboard (mode);
CREATE INDEX IF NOT EXISTS idx_leaderboard_time ON leaderboard (total_time ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stars ON leaderboard (stars_earned DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created ON leaderboard (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_nickname ON leaderboard (nickname);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data integrity and isolates administrative controls to auth users
-- ==============================================================================
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_config ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Anyone can submit scores" ON leaderboard;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Admins can update scores" ON leaderboard;
DROP POLICY IF EXISTS "Admins can delete scores" ON leaderboard;
DROP POLICY IF EXISTS "Anyone can view config" ON competition_config;
DROP POLICY IF EXISTS "Admins can update config" ON competition_config;

-- Policy 1: Anyone (including anonymous players) can submit their game run
CREATE POLICY "Anyone can submit scores" ON leaderboard
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Public leaderboard visibility (read-only for all visitors)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT TO anon, authenticated
  USING (true);

-- Policy 3: Only authenticated administrators can verify, flag, or modify player entries
CREATE POLICY "Admins can update scores" ON leaderboard
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy 4: Only authenticated administrators can delete player entries or clear table
CREATE POLICY "Admins can delete scores" ON leaderboard
  FOR DELETE TO authenticated
  USING (true);

-- Policy 5: Anyone can view active competition configuration and countdown rules
CREATE POLICY "Anyone can view config" ON competition_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- Policy 6: Only authenticated administrators can update tournament configuration
CREATE POLICY "Admins can update config" ON competition_config
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
