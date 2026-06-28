-- ═══════════════════════════════════════════════════════════════
-- V4: Anonymous Time Logs + Target System
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Anonymous Time Log support ──────────────────────────────
-- Make goal_id and work_area_id nullable on time_log
ALTER TABLE time_log
    ALTER COLUMN goal_id    DROP NOT NULL,
ALTER COLUMN work_area_id DROP NOT NULL;

-- Add the anonymous display name column
ALTER TABLE time_log
    ADD COLUMN IF NOT EXISTS anonymous_name VARCHAR(255);

-- Drop old NOT NULL indexes that assumed goal/work_area presence
-- (The functional index below replaces them with a proper constraint)
ALTER TABLE time_log
    ADD CONSTRAINT chk_timelog_mode CHECK (
        (goal_id IS NOT NULL AND work_area_id IS NOT NULL AND anonymous_name IS NULL)
            OR
        (goal_id IS NULL AND work_area_id IS NULL AND anonymous_name IS NOT NULL)
        );

-- ─── 2. Target System ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS target (
                                      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    work_area_id    UUID        NOT NULL REFERENCES work_area(id)    ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    week_start_date DATE        NOT NULL,   -- always a Monday
    is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_repeating    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_target_monday CHECK (EXTRACT(DOW FROM week_start_date) = 1)
    );

CREATE INDEX IF NOT EXISTS idx_target_user_week
    ON target (user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_target_user_repeating
    ON target (user_id, is_repeating, week_start_date);