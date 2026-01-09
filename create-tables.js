const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sRaD56UxQnuy@ep-still-thunder-ahjjklc2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function createTables() {
  try {
    console.log('Creating missing tables...');

    // Crear audit_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        action TEXT NOT NULL,
        resource TEXT,
        resource_id TEXT,
        old_values JSONB,
        new_values JSONB,
        user_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear automation_workflows
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation_workflows (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT false,
        trigger TEXT NOT NULL,
        trigger_config JSONB DEFAULT '{}',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear automation_actions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation_actions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        workflow_id TEXT NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        type TEXT NOT NULL,
        config JSONB DEFAULT '{}',
        delay INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear otras tablas básicas para que el test funcione
    await pool.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        stack TEXT,
        url TEXT,
        method TEXT,
        status_code INTEGER,
        user_id TEXT,
        request_id TEXT UNIQUE,
        user_agent TEXT,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();













