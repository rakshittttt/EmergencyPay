import { db } from './db';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';

// Check if we have a valid database URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Function to set up the database
async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Create schema and initial migration
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('Database setup complete.');
    await pool.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);