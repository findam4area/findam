/**
 * Script to check if activities table exists in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActivitiesTable() {
  console.log('Checking if activities table exists...\n');

  // Query the information_schema to check if activities table exists
  const { data, error } = await supabase
    .from('information_schema.tables' as any)
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'activities');

  if (error) {
    console.error('Error querying database:', error);
    
    // Try alternative approach - attempt to query the activities table directly
    console.log('\nTrying direct query approach...');
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities' as any)
      .select('*')
      .limit(1);

    if (activitiesError) {
      console.error('❌ Activities table does NOT exist');
      console.error('Error:', activitiesError.message);
      return false;
    } else {
      console.log('✅ Activities table EXISTS');
      console.log('Sample data:', activitiesData);
      return true;
    }
  }

  if (data && data.length > 0) {
    console.log('✅ Activities table EXISTS in the database');
    
    // Get column information
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns' as any)
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'activities');

    if (!colError && columns) {
      console.log('\nTable columns:');
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Activities table does NOT exist in the database');
    return false;
  }
}

checkActivitiesTable()
  .then((exists) => {
    process.exit(exists ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
