/**
 * Script to check if activities table exists in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActivitiesTable() {
  console.log('Checking if activities table exists...\n');

  // Try to query the activities table directly
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Activities table does NOT exist');
    console.error('Error:', error.message);
    console.error('\nThe activities table needs to be created in your Supabase database.');
    return false;
  } else {
    console.log('✅ Activities table EXISTS');
    if (data && data.length > 0) {
      console.log('\nSample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\nTable exists but is empty.');
    }
    return true;
  }
}

checkActivitiesTable()
  .then((exists) => {
    if (exists) {
      console.log('\n✅ Ready to regenerate types!');
    } else {
      console.log('\n⚠️  You need to create the activities table first.');
    }
    process.exit(exists ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
