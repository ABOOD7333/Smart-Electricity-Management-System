import { query } from './connection';
import { migrationSql } from './migration_sql';
import { schemaSql } from './schema_sql';

export async function runMigration(shouldExit = false) {
  console.log('⏳ Starting database setup & migration check...');
  try {
    // 1. Check if the 'zones' table exists in the database
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'zones'
      );
    `);
    
    const dbIsEmpty = !tableCheck.rows[0].exists;

    if (dbIsEmpty) {
      console.log('🌱 Database is empty. Initializing original schema...');
      await query(schemaSql);
      console.log('✅ Original database schema initialized successfully!');
    } else {
      console.log('📋 Database is already initialized. Skipping schema creation.');
    }

    console.log('⏳ Starting Phase 8 Multi-Tenant Database Migration...');
    // Execute the complete migration script (Directly from the compiled TS string!)
    await query(migrationSql);
    
    console.log('✅ Phase 8 Database Migration completed successfully!');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (shouldExit) {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

if (require.main === module) {
  runMigration(true);
}
