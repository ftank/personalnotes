const { Pool } = require('pg');

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
const initializeDatabase = async () => {
  try {
    if (pool) {
      console.log('Database already initialized');
      return pool;
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    console.log('✅ Database connected at:', result.rows[0].now);
    return pool;
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    throw error;
  }
};

/**
 * Get database pool
 * @returns {Pool} PostgreSQL pool
 */
const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return pool;
};

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} Query result
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', text);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>} Database client
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Close database connection
 */
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
};

module.exports = {
  initializeDatabase,
  getPool,
  query,
  getClient,
  closeDatabase
};
