import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const [users, listings, vendors, categories] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('vendor_applications').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  console.log('\n✅ Database Verification:');
  console.log(`   Users: ${users.count}`);
  console.log(`   Listings: ${listings.count}`);
  console.log(`   Vendor Applications: ${vendors.count}`);
  console.log(`   Categories: ${categories.count}\n`);
}

verify();
