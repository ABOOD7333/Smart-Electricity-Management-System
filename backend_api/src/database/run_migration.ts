import { query } from './connection';
import { migrationSql } from './migration_sql';

export async function runMigration(shouldExit = false) {
  console.log('⏳ Starting Phase 8 Multi-Tenant Database Migration...');
  try {
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
