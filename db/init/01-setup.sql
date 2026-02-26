-- Runs on first database initialization only.
-- Ensures the default user has the correct password and required extensions.

ALTER USER postgres PASSWORD 'postgres';

-- Useful extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
