import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  // Test product insert for TechHub
  const { data: business } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_name', 'TechHub Nigeria')
    .single();
  
  console.log('Business ID:', business?.id);
  
  if (business) {
    const { data, error } = await supabase
      .from('product_listings')
      .insert({
        business_profile_id: business.id,
        title: 'Test Product',
        description: 'Test description',
        product_type: 'physical',
        price: 100000,
        currency: 'NGN',
        stock_quantity: 10,
        is_active: true,
      })
      .select();
    
    console.log('Insert result:', { data, error });
  }
}

test();
