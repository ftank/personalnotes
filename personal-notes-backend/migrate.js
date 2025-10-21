const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    console.log('📁 Reading schema.sql...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    );

    console.log('📊 Executing SQL statements...');
    await query(schemaSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - conversations');
    console.log('  - messages');
    console.log('  - user_goals');
    console.log('  - progress_checkins');
    console.log('  - incidents');
    console.log('  - identified_patterns');
    console.log('  - security_logs');
    console.log('  - analytics_events');
    console.log('  - local_resources');
    console.log('  - user_consents');
    console.log('  - emergency_contacts');
    console.log('');
    console.log('🎉 Database is ready!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
