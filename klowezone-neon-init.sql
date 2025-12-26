-- =============================================
-- KLOWEZONE DATABASE INITIALIZATION SCRIPT
-- =============================================
-- Database: PostgreSQL 17
-- Platform: Neon (Serverless PostgreSQL)
-- Generated from Prisma schema.prisma
-- =============================================

-- =============================================
-- 1. ENUM TYPES
-- =============================================

-- Post and page status
CREATE TYPE post_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Log levels
CREATE TYPE log_level AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- Incident severity and status
CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE incident_status AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- Feedback types and status
CREATE TYPE feedback_type AS ENUM ('BUG', 'FEATURE_REQUEST', 'IMPROVEMENT', 'GENERAL');
CREATE TYPE feedback_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE feedback_status AS ENUM ('PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- Automation system enums
CREATE TYPE trigger_type AS ENUM ('NEW_LEAD', 'PROJECT_STATUS_CHANGE', 'FEEDBACK_RECEIVED', 'CRITICAL_ERROR', 'USER_REGISTERED', 'PAYMENT_RECEIVED', 'DEADLINE_APPROACHING');
CREATE TYPE action_type AS ENUM ('SEND_EMAIL', 'CREATE_NOTIFICATION', 'LOG_TO_SLACK', 'UPDATE_RECORD', 'CREATE_TASK', 'RUN_AI_ANALYSIS', 'SEND_WEBHOOK');
CREATE TYPE job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING');

-- =============================================
-- 2. TABLES - AUTH & RBAC SYSTEM
-- =============================================

-- Roles table
CREATE TABLE roles (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    avatar TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role_id VARCHAR(25) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role_id VARCHAR(25) NOT NULL,
    permission_id VARCHAR(25) NOT NULL,

    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT uk_role_permissions UNIQUE (role_id, permission_id)
);

-- =============================================
-- 3. TABLES - SYSTEM CONFIGURATION
-- =============================================

-- System configuration table (for encrypted settings)
CREATE TABLE system_config (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL, -- Encrypted JSON data
    category VARCHAR(255) NOT NULL, -- "email", "ai", "storage", "system"
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email providers table
CREATE TABLE email_providers (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(255) NOT NULL, -- "smtp", "sendgrid", "resend"
    config TEXT NOT NULL, -- Encrypted JSON with credentials
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI providers table
CREATE TABLE ai_providers (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(255) NOT NULL, -- "openai", "anthropic", "google"
    model VARCHAR(255) NOT NULL, -- "gpt-4", "claude-3", etc.
    config TEXT NOT NULL, -- Encrypted JSON with API keys
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    rate_limit INTEGER NOT NULL DEFAULT 100, -- requests per minute
    monthly_limit INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Storage providers table
CREATE TABLE storage_providers (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(255) NOT NULL, -- "s3", "r2", "local"
    config TEXT NOT NULL, -- Encrypted JSON with credentials
    bucket VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. TABLES - CMS SYSTEM
-- =============================================

-- Blog posts table
CREATE TABLE blog_posts (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL, -- Markdown content
    excerpt TEXT,
    cover_image TEXT,
    status post_status NOT NULL DEFAULT 'DRAFT',
    seo_title VARCHAR(500),
    seo_description TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of tags as JSONB
    author_id VARCHAR(25) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_blog_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Pages table
CREATE TABLE pages (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL, -- HTML/Markdown content
    status post_status NOT NULL DEFAULT 'DRAFT',
    seo_title VARCHAR(500),
    seo_description TEXT,
    author_id VARCHAR(25) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pages_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Testimonials table
CREATE TABLE testimonials (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    company VARCHAR(255),
    content TEXT NOT NULL,
    avatar TEXT,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    author_id VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_testimonials_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Media files table
CREATE TABLE media_files (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    filename VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    alt TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of tags as JSONB
    folder VARCHAR(255) NOT NULL DEFAULT 'general',
    uploaded_by VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_media_files_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================
-- 5. TABLES - METRICS & ANALYTICS
-- =============================================

-- Metric events table
CREATE TABLE metric_events (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_name VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL, -- Flexible JSON data
    user_id VARCHAR(25),
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_metric_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Metric dashboards table
CREATE TABLE metric_dashboards (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL, -- Dashboard configuration
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_metric_dashboards_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================
-- 6. TABLES - LOGGING SYSTEM
-- =============================================

-- Error logs table
CREATE TABLE error_logs (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    level log_level NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    url TEXT,
    method VARCHAR(10),
    status_code INTEGER,
    user_id VARCHAR(25),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_error_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit logs table
CREATE TABLE audit_logs (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action VARCHAR(255) NOT NULL, -- "create", "update", "delete"
    resource VARCHAR(255) NOT NULL, -- "user", "post", "setting"
    resource_id VARCHAR(25),
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(25) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Incidents table
CREATE TABLE incidents (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'OPEN',
    assigned_to VARCHAR(25),
    reported_by VARCHAR(25) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_incidents_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_incidents_reporter FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Incident comments table
CREATE TABLE incident_comments (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content TEXT NOT NULL,
    incident_id VARCHAR(25) NOT NULL,
    author_id VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_incident_comments_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    CONSTRAINT fk_incident_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================
-- 7. TABLES - FEEDBACK SYSTEM
-- =============================================

-- Feedback table
CREATE TABLE feedback (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type feedback_type NOT NULL,
    priority feedback_priority NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    screenshot TEXT,
    url TEXT,
    user_agent TEXT,
    user_id VARCHAR(25),
    status feedback_status NOT NULL DEFAULT 'PENDING',
    assigned_to VARCHAR(25),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_feedback_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Feedback comments table
CREATE TABLE feedback_comments (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content TEXT NOT NULL,
    feedback_id VARCHAR(25) NOT NULL,
    author_id VARCHAR(25) NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- Only visible to admins
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_feedback_comments_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- =============================================
-- 8. TABLES - AUTOMATION SYSTEM
-- =============================================

-- Automation workflows table
CREATE TABLE automation_workflows (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    trigger trigger_type NOT NULL,
    trigger_config JSONB NOT NULL, -- Configuration for the trigger (filters, conditions)
    created_by VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_automation_workflows_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Automation actions table
CREATE TABLE automation_actions (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workflow_id VARCHAR(25) NOT NULL,
    "order" INTEGER NOT NULL, -- Execution order
    type action_type NOT NULL,
    config JSONB NOT NULL, -- Action-specific configuration
    delay INTEGER NOT NULL DEFAULT 0, -- Delay in seconds before execution
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_automation_actions_workflow FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE
);

-- Automation runs table
CREATE TABLE automation_runs (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workflow_id VARCHAR(25) NOT NULL,
    trigger_data JSONB NOT NULL, -- Data that triggered the automation
    status job_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_automation_runs_workflow FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE RESTRICT
);

-- Job queue table
CREATE TABLE job_queue (
    id VARCHAR(25) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    run_id VARCHAR(25) NOT NULL,
    action_id VARCHAR(25) NOT NULL,
    status job_status NOT NULL DEFAULT 'PENDING',
    payload JSONB NOT NULL, -- Job execution data
    priority INTEGER NOT NULL DEFAULT 1, -- 1=low, 5=high
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_job_queue_run FOREIGN KEY (run_id) REFERENCES automation_runs(id) ON DELETE RESTRICT
);

-- =============================================
-- 9. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Roles and permissions indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- System config indexes
CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_category ON system_config(category);
CREATE INDEX idx_system_config_is_secret ON system_config(is_secret);

-- CMS indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN (tags);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_author_id ON pages(author_id);
CREATE INDEX idx_pages_published_at ON pages(published_at);

CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_folder ON media_files(folder);
CREATE INDEX idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX idx_media_files_tags ON media_files USING GIN (tags);

-- Metrics indexes
CREATE INDEX idx_metric_events_user_id ON metric_events(user_id);
CREATE INDEX idx_metric_events_event_name ON metric_events(event_name);
CREATE INDEX idx_metric_events_timestamp ON metric_events(timestamp);
CREATE INDEX idx_metric_events_session_id ON metric_events(session_id);

CREATE INDEX idx_metric_dashboards_created_by ON metric_dashboards(created_by);
CREATE INDEX idx_metric_dashboards_is_public ON metric_dashboards(is_public);

-- Logging indexes
CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_request_id ON error_logs(request_id);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- Feedback indexes
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_assigned_to ON feedback(assigned_to);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Automation indexes
CREATE INDEX idx_automation_workflows_created_by ON automation_workflows(created_by);
CREATE INDEX idx_automation_workflows_is_active ON automation_workflows(is_active);
CREATE INDEX idx_automation_workflows_trigger ON automation_workflows(trigger);

CREATE INDEX idx_automation_actions_workflow_id ON automation_actions(workflow_id);
CREATE INDEX idx_automation_actions_order ON automation_actions(workflow_id, "order");

CREATE INDEX idx_automation_runs_workflow_id ON automation_runs(workflow_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_created_at ON automation_runs(created_at);

CREATE INDEX idx_job_queue_run_id ON job_queue(run_id);
CREATE INDEX idx_job_queue_action_id ON job_queue(action_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_scheduled_for ON job_queue(scheduled_for);
CREATE INDEX idx_job_queue_priority ON job_queue(priority DESC);

-- =============================================
-- 10. FUNCTIONS AND TRIGGERS FOR BUSINESS LOGIC
-- =============================================

-- Function to ensure only one default provider per type
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_default to TRUE, set all others to FALSE for the same provider type
    IF NEW.is_default = TRUE THEN
        -- Determine which table this trigger is for based on TG_TABLE_NAME
        CASE TG_TABLE_NAME
            WHEN 'email_providers' THEN
                UPDATE email_providers SET is_default = FALSE WHERE id != NEW.id;
            WHEN 'ai_providers' THEN
                UPDATE ai_providers SET is_default = FALSE WHERE id != NEW.id;
            WHEN 'storage_providers' THEN
                UPDATE storage_providers SET is_default = FALSE WHERE id != NEW.id;
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to enforce single default provider
CREATE TRIGGER trg_email_providers_single_default
    BEFORE INSERT OR UPDATE ON email_providers
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_provider();

CREATE TRIGGER trg_ai_providers_single_default
    BEFORE INSERT OR UPDATE ON ai_providers
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_provider();

CREATE TRIGGER trg_storage_providers_single_default
    BEFORE INSERT OR UPDATE ON storage_providers
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_provider();

-- =============================================
-- 11. DEFAULT DATA - INITIAL SETUP
-- =============================================

-- Insert default roles
INSERT INTO roles (id, name, description, is_system) VALUES
('role_super_admin', 'Super Admin', 'Full system access with all permissions', true),
('role_admin', 'Admin', 'Administrative access to most features', true),
('role_editor', 'Editor', 'Can create and edit content', true),
('role_user', 'User', 'Basic user access', true);

-- Insert default permissions
INSERT INTO permissions (id, name, resource, action, description) VALUES
-- User management
('perm_users_create', 'users:create', 'users', 'create', 'Create new users'),
('perm_users_read', 'users:read', 'users', 'read', 'View user information'),
('perm_users_update', 'users:update', 'users', 'update', 'Update user information'),
('perm_users_delete', 'users:delete', 'users', 'delete', 'Delete users'),

-- Content management
('perm_posts_create', 'posts:create', 'posts', 'create', 'Create blog posts and pages'),
('perm_posts_read', 'posts:read', 'posts', 'read', 'View posts and pages'),
('perm_posts_update', 'posts:update', 'posts', 'update', 'Edit posts and pages'),
('perm_posts_delete', 'posts:delete', 'posts', 'delete', 'Delete posts and pages'),
('perm_posts_publish', 'posts:publish', 'posts', 'publish', 'Publish posts and pages'),

-- System administration
('perm_system_config', 'system:config', 'system', 'config', 'Configure system settings'),
('perm_system_logs', 'system:logs', 'system', 'logs', 'View system logs'),
('perm_system_backup', 'system:backup', 'system', 'backup', 'Create system backups'),

-- Automation
('perm_automation_create', 'automation:create', 'automation', 'create', 'Create automation workflows'),
('perm_automation_read', 'automation:read', 'automation', 'read', 'View automation workflows'),
('perm_automation_update', 'automation:update', 'automation', 'update', 'Edit automation workflows'),
('perm_automation_delete', 'automation:delete', 'automation', 'delete', 'Delete automation workflows');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Super Admin gets all permissions
('role_super_admin', 'perm_users_create'),
('role_super_admin', 'perm_users_read'),
('role_super_admin', 'perm_users_update'),
('role_super_admin', 'perm_users_delete'),
('role_super_admin', 'perm_posts_create'),
('role_super_admin', 'perm_posts_read'),
('role_super_admin', 'perm_posts_update'),
('role_super_admin', 'perm_posts_delete'),
('role_super_admin', 'perm_posts_publish'),
('role_super_admin', 'perm_system_config'),
('role_super_admin', 'perm_system_logs'),
('role_super_admin', 'perm_system_backup'),
('role_super_admin', 'perm_automation_create'),
('role_super_admin', 'perm_automation_read'),
('role_super_admin', 'perm_automation_update'),
('role_super_admin', 'perm_automation_delete'),

-- Admin gets most permissions except system backup
('role_admin', 'perm_users_create'),
('role_admin', 'perm_users_read'),
('role_admin', 'perm_users_update'),
('role_admin', 'perm_users_delete'),
('role_admin', 'perm_posts_create'),
('role_admin', 'perm_posts_read'),
('role_admin', 'perm_posts_update'),
('role_admin', 'perm_posts_delete'),
('role_admin', 'perm_posts_publish'),
('role_admin', 'perm_system_config'),
('role_admin', 'perm_system_logs'),
('role_admin', 'perm_automation_create'),
('role_admin', 'perm_automation_read'),
('role_admin', 'perm_automation_update'),
('role_admin', 'perm_automation_delete'),

-- Editor gets content permissions
('role_editor', 'perm_posts_create'),
('role_editor', 'perm_posts_read'),
('role_editor', 'perm_posts_update'),
('role_editor', 'perm_posts_publish'),

-- User gets basic read permissions
('role_user', 'perm_posts_read'),
('role_user', 'perm_automation_read');

-- =============================================
-- 12. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables that have this column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_providers_updated_at BEFORE UPDATE ON email_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storage_providers_updated_at BEFORE UPDATE ON storage_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metric_dashboards_updated_at BEFORE UPDATE ON metric_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIALIZATION COMPLETE
-- =============================================

-- Verify the setup
SELECT
    'Klowezone database initialized successfully!' as status,
    (SELECT COUNT(*) FROM roles) as roles_count,
    (SELECT COUNT(*) FROM permissions) as permissions_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM automation_workflows) as workflows_count;
