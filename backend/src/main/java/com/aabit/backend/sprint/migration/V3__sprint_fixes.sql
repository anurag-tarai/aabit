-- V3__sprint_fixes.sql
-- Add created_at to time_log (was missing in V2)
ALTER TABLE time_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop the old "active" status index (sprint status is now date-derived, not a flag)
-- Keep the existing performance indexes, they are still valid.

-- Ensure work_area uses goal_id column directly (no join column ambiguity)
-- V2 already has the correct schema; this migration is a no-op if already applied correctly.
