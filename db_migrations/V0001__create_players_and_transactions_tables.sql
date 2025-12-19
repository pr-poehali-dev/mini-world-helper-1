CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Игрок',
    beans INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_withdrawn INTEGER NOT NULL DEFAULT 0,
    channel_joined BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_beans ON players(beans DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);