require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fix() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('✓ Подключено');
    
    // Удалить и пересоздать auth.session с правильным типом id
    await client.query('DROP TABLE IF EXISTS auth.session CASCADE');
    await client.query(`
      CREATE TABLE auth.session (
        id text PRIMARY KEY,
        user_id uuid REFERENCES auth."user"(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_auth_session_user_id ON auth.session(user_id)');
    
    console.log('✅ auth.session пересоздана с типом id=text');
  } catch (e) {
    console.error('❌', e);
  } finally {
    await client.end();
  }
}

fix();

