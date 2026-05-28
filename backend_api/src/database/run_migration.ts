import { query } from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigration(shouldExit = false) {
  console.log('⏳ Starting Phase 8 Multi-Tenant Database Migration...');
  try {
    let migrationSqlPath = path.join(__dirname, 'migration_phase8.sql');
    if (!fs.existsSync(migrationSqlPath)) {
      // Fallback for production where .sql might not be copied to /dist/
      migrationSqlPath = path.join(process.cwd(), 'src', 'database', 'migration_phase8.sql');
    }
    if (!fs.existsSync(migrationSqlPath)) {
      throw new Error(`Migration SQL file not found at: ${migrationSqlPath}`);
    }

    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');
    
    // Execute the complete migration script
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
