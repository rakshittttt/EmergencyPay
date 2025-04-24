import { createClient } from "@supabase/supabase-js";

// To make this work, you need to provide real Supabase credentials
// You can sign up for free at https://supabase.com and create a new project
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);