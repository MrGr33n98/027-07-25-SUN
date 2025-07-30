-- Database Performance Optimization Indexes
-- This script creates additional indexes for better query performance

-- User table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified ON users(email, "emailVerified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_failed_attempts ON users("failedLoginAttempts") WHERE "failedLoginAttempts" > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_locked_until ON users("accountLockedUntil") WHERE "accountLockedUntil" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users("lastLoginAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created ON users(role, "createdAt");

-- Company profile optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_location ON company_profiles(city, state);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_verified_rating ON company_profiles(verified, rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_specialties ON company_profiles USING GIN(specialties);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_search ON company_profiles(verified, rating DESC, "reviewCount" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_slug_verified ON company_profiles(slug, verified);

-- Product optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price_range ON products(price) WHERE status = 'APPROVED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_stock ON products("companyId", "inStock") WHERE status = 'APPROVED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON products(category, "inStock", status, price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_model ON products(brand, model) WHERE brand IS NOT NULL;

-- Security event optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_type ON security_events("userId", "eventType", timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip_timestamp ON security_events("ipAddress", timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_failed_logins ON security_events("eventType", success, timestamp DESC) 
    WHERE "eventType" = 'LOGIN_ATTEMPT' AND success = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_suspicious ON security_events("eventType", timestamp DESC) 
    WHERE "eventType" = 'SUSPICIOUS_ACTIVITY';

-- Auth session optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_expires ON auth_sessions("userId", "expiresAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_token_expires ON auth_sessions(token, "expiresAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_cleanup ON auth_sessions("expiresAt") WHERE "expiresAt" < NOW();

-- Review optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_company_status ON reviews("companyId", status, "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating_verified ON reviews(rating, verified) WHERE status = 'APPROVED';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_moderation ON reviews(status, "moderatedAt") WHERE status = 'PENDING';

-- Project optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_company_status ON projects("companyId", status, "completionDate" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_type_location ON projects("projectType", location) WHERE status = 'APPROVED';

-- Lead optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_company_status ON leads("companyId", status, "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_location_type ON leads(location, "projectType");

-- Quote optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_company_status ON quotes("companyId", status, "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_user_status ON quotes("userId", status) WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_valid_until ON quotes("validUntil") WHERE "validUntil" > NOW();

-- Appointment optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_company_date ON appointments("companyId", date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_date ON appointments("userId", date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_upcoming ON appointments(date, status) WHERE date > NOW();

-- Notification optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications("userId", read, "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_created ON notifications(type, "createdAt" DESC);

-- Message optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created ON messages("conversationId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_created ON messages("senderId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_unread ON messages("receiverId", read, "createdAt" DESC);

-- Favorite optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_created ON favorites("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_favorites_user_created ON product_favorites("userId", "createdAt" DESC);

-- System log optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_level_timestamp ON system_logs(level, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_category_timestamp ON system_logs(category, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_user_timestamp ON system_logs("userId", timestamp DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_request_id ON system_logs("requestId") WHERE "requestId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_cleanup ON system_logs(timestamp) WHERE timestamp < NOW() - INTERVAL '30 days';

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_search_composite ON company_profiles(verified, city, state, rating DESC, "reviewCount" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_search_composite ON products(status, category, "inStock", price, "companyId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_auth_composite ON users(email, "emailVerified", "accountLockedUntil", "failedLoginAttempts");

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verified_companies ON company_profiles(rating DESC, "reviewCount" DESC) WHERE verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_available_products ON products(category, price, "companyId") WHERE status = 'APPROVED' AND "inStock" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_sessions ON auth_sessions("userId", "lastAccessedAt" DESC) WHERE "expiresAt" > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_reviews ON reviews("companyId", "createdAt" DESC) WHERE status = 'PENDING';

-- Text search indexes (if using PostgreSQL full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_search_text ON company_profiles USING GIN(to_tsvector('portuguese', name || ' ' || description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_text ON products USING GIN(to_tsvector('portuguese', name || ' ' || description));

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- Index usage statistics view
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 100 THEN 'Rarely used'
        ELSE 'Frequently used'
    END as usage_level
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table size and bloat monitoring
CREATE OR REPLACE VIEW table_size_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_operations,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 
        THEN round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
        ELSE 0 
    END as dead_tuple_percent,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Create a function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
    query_type text,
    avg_duration numeric,
    max_duration numeric,
    call_count bigint,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE '%SELECT%FROM users%' THEN 'User Queries'
            WHEN query LIKE '%SELECT%FROM company_profiles%' THEN 'Company Queries'
            WHEN query LIKE '%SELECT%FROM products%' THEN 'Product Queries'
            WHEN query LIKE '%INSERT%' THEN 'Insert Operations'
            WHEN query LIKE '%UPDATE%' THEN 'Update Operations'
            ELSE 'Other'
        END as query_type,
        round(avg(mean_time), 2) as avg_duration,
        round(max(max_time), 2) as max_duration,
        sum(calls) as call_count,
        CASE 
            WHEN avg(mean_time) > 1000 THEN 'Consider query optimization or indexing'
            WHEN avg(mean_time) > 500 THEN 'Monitor for performance degradation'
            ELSE 'Performance is acceptable'
        END as recommendation
    FROM pg_stat_statements
    WHERE calls > 10 -- Only consider queries called more than 10 times
    GROUP BY 1
    ORDER BY avg_duration DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON INDEX idx_users_email_verified IS 'Optimizes user authentication queries';
COMMENT ON INDEX idx_company_profiles_search IS 'Optimizes company search and listing queries';
COMMENT ON INDEX idx_products_search IS 'Optimizes product search and filtering queries';
COMMENT ON INDEX idx_security_events_user_type IS 'Optimizes security audit and monitoring queries';
COMMENT ON VIEW performance_slow_queries IS 'Identifies slow queries for optimization';
COMMENT ON VIEW index_usage_stats IS 'Monitors index usage to identify unused indexes';
COMMENT ON VIEW table_size_stats IS 'Monitors table size and bloat for maintenance planning';
COMMENT ON FUNCTION analyze_query_performance IS 'Analyzes query performance patterns and provides recommendations';