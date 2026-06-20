-- Permanent Blueprint: Long-Lived Goals
CREATE TABLE IF NOT EXISTS goal (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10b981',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- Permanent Blueprint: Work Areas belonging to Goals
CREATE TABLE IF NOT EXISTS work_area (
                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
    );

-- Temporal Container: Sprints
CREATE TABLE IF NOT EXISTS sprint (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE'
    );

-- Many-to-Many Bridge: Mapping Goals into Sprints
CREATE TABLE IF NOT EXISTS sprint_goal (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
    priority INT DEFAULT 1,
    CONSTRAINT unique_user_sprint_goal UNIQUE(sprint_id, goal_id)
    );

-- The Central Ledger: Time Logs
CREATE TABLE IF NOT EXISTS time_log (
                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
    work_area_id UUID NOT NULL REFERENCES work_area(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprint(id) ON DELETE SET NULL, -- Nullable for out-of-sprint history
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- High-Velocity Query Indexes
CREATE INDEX IF NOT EXISTS idx_timelog_firewall ON time_log (user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timelog_grid_agg ON time_log (sprint_id, goal_id, start_time);