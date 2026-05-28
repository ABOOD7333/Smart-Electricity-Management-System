import { query } from './connection';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('⏳ Starting Phase 8 Multi-Tenant Database Migration...');
  try {
    const migrationSqlPath = path.join(__dirname, 'migration_phase8.sql');
    if (!fs.existsSync(migrationSqlPath)) {
      throw new Error(`Migration SQL file not found at: ${migrationSqlPath}`);
    }

    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');
    
    // Execute the complete migration script
    await query(migrationSql);
    
    console.log('✅ Phase 8 Database Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
