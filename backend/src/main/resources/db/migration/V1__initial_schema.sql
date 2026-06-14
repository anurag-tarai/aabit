CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE experience_entry (
                                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

                                  timestamp TIMESTAMPTZ NOT NULL,

                                  markdown_content TEXT NOT NULL,

                                  sensitive BOOLEAN NOT NULL DEFAULT FALSE,

                                  deleted BOOLEAN NOT NULL DEFAULT FALSE,

                                  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE experience_tag (
                                experience_id UUID NOT NULL,

                                tag VARCHAR(50) NOT NULL,

                                CONSTRAINT fk_experience_tag
                                    FOREIGN KEY (experience_id)
                                        REFERENCES experience_entry(id)
                                        ON DELETE CASCADE
);

CREATE INDEX idx_experience_timestamp
    ON experience_entry(timestamp DESC);

CREATE INDEX idx_experience_deleted
    ON experience_entry(deleted);

CREATE INDEX idx_experience_tag
    ON experience_tag(tag);