-- Init script for PostgreSQL database
-- Tables: users, orders

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optional: Add some sample data for testing
-- INSERT INTO users (name, email) VALUES 
--     ('Test User 1', 'test1@example.com'),
--     ('Test User 2', 'test2@example.com'),
--     ('Test User 3', 'test3@example.com');

-- Verify tables
SELECT 'Users table created' AS status;
SELECT COUNT(*) as user_count FROM users;

SELECT 'Orders table created' AS status;
SELECT COUNT(*) as order_count FROM orders;