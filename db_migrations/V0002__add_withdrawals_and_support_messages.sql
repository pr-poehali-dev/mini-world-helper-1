-- Create withdrawals table to track all withdrawal requests
CREATE TABLE IF NOT EXISTS t_p6062548_mini_world_helper_1.withdrawals (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by VARCHAR(255)
);

-- Create support_messages table to track player questions
CREATE TABLE IF NOT EXISTS t_p6062548_mini_world_helper_1.support_messages (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_player_id ON t_p6062548_mini_world_helper_1.withdrawals(player_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON t_p6062548_mini_world_helper_1.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_player_id ON t_p6062548_mini_world_helper_1.support_messages(player_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON t_p6062548_mini_world_helper_1.support_messages(status);