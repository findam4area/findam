/**
 * Script to regenerate Supabase types using the Management API
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const projectRef = 'whcwffuchlyjqhdpdwwi'; // From your Supabase URL

console.log('🔄 Regenerating Supabase types...\n');
console.log('Project:', projectRef);
console.log('\n⚠️  Note: This requires Supabase CLI with authentication.');
console.log('Please run one of the following commands manually:\n');
console.log('Option 1 - Using Supabase CLI (recommended):');
console.log(`  npx supabase login`);
console.log(`  npx supabase gen types typescript --project-id ${projectRef} > lib/supabase/database.types.ts\n`);
console.log('Option 2 - Using Supabase CLI with linked project:');
console.log(`  npx supabase link --project-ref ${projectRef}`);
console.log(`  npx supabase gen types typescript --linked > lib/supabase/database.types.ts\n`);
console.log('Option 3 - Using access token:');
console.log(`  npx supabase gen types typescript --project-id ${projectRef} --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres" > lib/supabase/database.types.ts\n`);

process.exit(0);
