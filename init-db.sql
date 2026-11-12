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

-- Deterministic dataset for benchmarks (see docs/methodology.md, section 6).
-- Idempotent: re-running the init script does not duplicate rows.
-- 200 users, 800 orders (4 per user). User 1 always exists so the read
-- scenario exercises real rows instead of 404 paths.
INSERT INTO users (id, name, email)
SELECT g, 'Bench User ' || g, 'bench.user' || g || '@runtime-bench.local'
FROM generate_series(1, 200) AS g
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, user_id, amount, status)
SELECT
    g,
    ((g - 1) % 200) + 1,
    ((g % 490) + 10)::numeric(10, 2),
    CASE g % 3 WHEN 0 THEN 'completed' WHEN 1 THEN 'pending' ELSE 'cancelled' END
FROM generate_series(1, 800) AS g
ON CONFLICT (id) DO NOTHING;

-- Keep sequences ahead of the seeded rows so inserts keep working.
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders));

-- Verify tables
SELECT 'Users table created' AS status;
SELECT COUNT(*) as user_count FROM users;

SELECT 'Orders table created' AS status;
SELECT COUNT(*) as order_count FROM orders;