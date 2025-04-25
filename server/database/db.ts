import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema';
import ws from 'ws';

// Configure Neon serverless driver to use WebSockets
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Create a PostgreSQL pool
export const pool = new Pool({ connectionString: DATABASE_URL });

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Stub for supabase client - will be replaced with real client if credentials are available
let supabase: any = {
  from: () => ({
    select: () => ({ data: null, error: new Error('Supabase not configured') }),
    insert: () => ({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({ data: null, error: new Error('Supabase not configured') }),
    delete: () => ({ data: null, error: new Error('Supabase not configured') }),
  }),
  storage: {
    from: () => ({
      upload: () => ({ data: null, error: new Error('Supabase not configured') }),
      getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
    }),
  },
  auth: {
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
  },
};

// Initialize Supabase if credentials are provided
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('Supabase client initialized successfully');
  } else {
    console.log('Supabase not configured - some features will be disabled');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  console.log('Continuing with limited functionality');
}

export { supabase };