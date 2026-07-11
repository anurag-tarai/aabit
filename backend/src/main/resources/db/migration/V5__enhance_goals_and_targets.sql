-- ═══════════════════════════════════════════════════════════════
-- V5: Goal Priority & Target Enhancements
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Goal Table Enhancements ─────────────────────────────────
ALTER TABLE goal
    ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN IF NOT EXISTS target_time_percentage INTEGER NOT NULL DEFAULT 0;

-- ─── 2. Target Table Enhancements ───────────────────────────────
-- Allow targets to exist without work areas (nullable)
ALTER TABLE target
    ALTER COLUMN work_area_id DROP NOT NULL;

-- Link target directly to a Goal (optional)
ALTER TABLE target
    ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goal(id) ON DELETE CASCADE;

-- Target properties: type, date, fixed, priority
ALTER TABLE target
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) NOT NULL DEFAULT 'WEEKLY',
    ADD COLUMN IF NOT EXISTS target_date DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM';
