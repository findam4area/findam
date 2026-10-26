/**
 * Add products and services to existing sample businesses
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function addProductsAndServices() {
  console.log('🔄 Adding products and services to existing businesses...\n');

  // Get all sample businesses
  const { data: businesses, error } = await supabase
    .from('business_profiles')
    .select('id, business_name, business_type')
    .in('business_name', [
      'TechHub Nigeria', 'GadgetZone Abuja', 'CodeCraft Academy',
      'AutoParts Express', 'Elite Auto Detailing', 'MechaniPro Garage',
      'StyleHub Boutique', 'Gele & Lace Palace', 'FootWear Kingdom',
      'Mama Put Deluxe', 'Brew & Bites Café', 'Spice Route Kitchen',
      'DesignPro Studio', 'The Content Factory', 'TutorHub Nigeria',
      'SparkleClean Pro', 'EventMasters Nigeria', 'SnapShot Photography'
    ]);

  if (error || !businesses) {
    console.error('❌ Failed to fetch businesses:', error?.message);
    return;
  }

  console.log(`✅ Found ${businesses.length} businesses to update\n`);

  let totalProducts = 0;
  let totalServices = 0;

  for (const business of businesses) {
    console.log(`📦 ${business.business_name}`);

    // Check if already has products/services
    if (business.business_type === 'product' || business.business_type === 'both') {
      const { count } = await supabase
        .from('product_listings')
        .select('*', { count: 'exact', head: true })
        .eq('business_profile_id', business.id);

      if (count && count > 0) {
        console.log(`   ⏭️  Already has ${count} products, skipping...\n`);
        continue;
      }
    }

    if (business.business_type === 'service' || business.business_type === 'both') {
      const { count } = await supabase
        .from('service_listings')
        .select('*', { count: 'exact', head: true })
        .eq('business_profile_id', business.id);

      if (count && count > 0) {
        console.log(`   ⏭️  Already has ${count} services, skipping...\n`);
        continue;
      }
    }

    // Add products/services based on business name
    const productsAdded = await addProductsForBusiness(business.id, business.business_name);
    const servicesAdded = await addServicesForBusiness(business.id, business.business_name);

    console.log(`   ✅ Added ${productsAdded} products, ${servicesAdded} services\n`);
    totalProducts += productsAdded;
    totalServices += servicesAdded;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Total: ${totalProducts} products, ${totalServices} services added`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function addProductsForBusiness(businessId: string, businessName: string): Promise<number> {
  const productData: Record<string, any[]> = {
    'TechHub Nigeria': [
      { title: 'MacBook Pro M3 16-inch', description: 'Latest Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', price: 2850000, stock_quantity: 5 },
      { title: 'iPhone 15 Pro Max', description: '256GB, all colors available. Genuine warranty', price: 1450000, stock_quantity: 12 },
      { title: 'Samsung Galaxy S24 Ultra', description: '512GB storage, S-Pen included', price: 1250000, stock_quantity: 8 },
      { title: 'Sony WH-1000XM5 Headphones', description: 'Noise cancellation, 30-hour battery', price: 285000, stock_quantity: 15 },
    ],
    'GadgetZone Abuja': [
      { title: 'PlayStation 5 Slim Console', description: 'PS5 with 2 controllers, FIFA 24', price: 865000, stock_quantity: 4 },
      { title: 'Ring Video Doorbell Pro', description: 'HD video, motion detection', price: 145000, stock_quantity: 20 },
      { title: 'Amazon Echo Dot (5th Gen)', description: 'Smart speaker with Alexa', price: 48000, stock_quantity: 35 },
      { title: 'Logitech G Pro Wireless Mouse', description: 'Gaming mouse, 25K DPI', price: 95000, stock_quantity: 18 },
    ],
    'AutoParts Express': [
      { title: 'Bosch Car Battery 75Ah', description: '3-year warranty, fits most sedans', price: 85000, stock_quantity: 25 },
      { title: 'Michelin Pilot Sport Tires', description: 'Set of 4, 225/45R17', price: 320000, stock_quantity: 12 },
      { title: 'Denso Brake Pads', description: 'OEM-quality ceramic brake pads', price: 45000, stock_quantity: 40 },
      { title: 'Mobil 1 Synthetic Oil', description: '5 Liters, 5W-30', price: 28000, stock_quantity: 60 },
    ],
    'StyleHub Boutique': [
      { title: 'Men\'s Designer Kaftan Set', description: 'Premium senator kaftan with embroidery', price: 85000, stock_quantity: 15 },
      { title: 'Women\'s Ankara Midi Dress', description: 'Vibrant African print dress', price: 45000, stock_quantity: 30 },
      { title: 'Men\'s Fitted Suit', description: '3-piece suit, Italian wool blend', price: 125000, stock_quantity: 8 },
      { title: 'Women\'s Leather Handbag', description: 'Genuine leather tote bag', price: 75000, stock_quantity: 12 },
    ],
    'Gele & Lace Palace': [
      { title: 'Premium Aso-Oke Fabric', description: 'Hand-woven, 5 yards', price: 145000, stock_quantity: 8 },
      { title: 'French Lace', description: '5 yards with stones and sequins', price: 95000, stock_quantity: 20 },
      { title: 'Ready-Made Gele', description: 'Pre-tied gele, easy to wear', price: 25000, stock_quantity: 40 },
      { title: 'Ankara Print Fabric', description: '6 yards, vibrant colors', price: 18000, stock_quantity: 60 },
    ],
    'FootWear Kingdom': [
      { title: 'Men\'s Italian Leather Oxfords', description: 'Handcrafted dress shoes', price: 65000, stock_quantity: 18 },
      { title: 'Women\'s Designer Heels', description: '4-inch stiletto heels', price: 48000, stock_quantity: 25 },
      { title: 'Men\'s Casual Sneakers', description: 'Turkish-made, breathable', price: 35000, stock_quantity: 35 },
      { title: 'Women\'s Crossbody Bag', description: 'Compact leather bag', price: 42000, stock_quantity: 20 },
    ],
    'Brew & Bites Café': [
      { title: 'Coffee Beans (250g)', description: 'Signature medium roast', price: 5500, stock_quantity: 50 },
      { title: 'House-Made Granola', description: '500g, honey-roasted', price: 3800, stock_quantity: 30 },
    ],
  };

  const products = productData[businessName] || [];
  if (products.length === 0) return 0;

  let inserted = 0;
  for (const product of products) {
    const { error } = await supabase.from('product_listings').insert({
      business_profile_id: businessId,
      title: product.title,
      description: product.description,
      product_type: 'physical',
      price: product.price,
      currency: 'NGN',
      stock_quantity: product.stock_quantity,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: Math.random() > 0.7,
    });
    if (!error) inserted++;
  }

  return inserted;
}

async function addServicesForBusiness(businessId: string, businessName: string): Promise<number> {
  const serviceData: Record<string, any[]> = {
    'CodeCraft Academy': [
      { title: 'Full-Stack Web Development Bootcamp', description: '16-week intensive program', pricing_model: 'fixed', price: 450000, duration_text: '16 weeks' },
      { title: 'Mobile App Development', description: 'React Native course, 12 weeks', pricing_model: 'fixed', price: 380000, duration_text: '12 weeks' },
      { title: 'Cloud Computing Certification', description: 'AWS or Azure prep course', pricing_model: 'fixed', price: 320000, duration_text: '8 weeks' },
      { title: 'IT Consulting', description: 'Technology strategy consulting', pricing_model: 'hourly', price: 35000, duration_text: 'Per hour' },
    ],
    'Elite Auto Detailing': [
      { title: 'Premium Exterior Detailing', description: 'Hand wash, polish, wax, tire dressing', pricing_model: 'fixed', price: 45000, duration_text: '3-4 hours' },
      { title: 'Interior Deep Cleaning', description: 'Vacuum, steam clean, leather conditioning', pricing_model: 'fixed', price: 35000, duration_text: '2-3 hours' },
      { title: 'Complete Detailing Package', description: 'Full exterior and interior detailing', pricing_model: 'fixed', price: 75000, duration_text: '5-6 hours' },
      { title: 'Ceramic Coating', description: 'Professional-grade ceramic coating', pricing_model: 'fixed', price: 185000, duration_text: 'Full day' },
    ],
    'MechaniPro Garage': [
      { title: 'Vehicle Inspection', description: 'Full 50-point inspection', pricing_model: 'fixed', price: 15000, duration_text: '1-2 hours' },
      { title: 'Engine Diagnostics', description: 'Computer diagnostics and troubleshooting', pricing_model: 'custom', price: 0, duration_text: 'Varies' },
      { title: 'Brake System Service', description: 'Inspection, pad replacement, fluid flush', pricing_model: 'fixed', price: 65000, duration_text: '2-3 hours' },
      { title: 'AC System Service', description: 'AC diagnostic, refrigerant recharge', pricing_model: 'fixed', price: 45000, duration_text: '2-3 hours' },
    ],
    'Mama Put Deluxe': [
      { title: 'Jollof Rice & Grilled Chicken', description: 'Signature jollof with chicken, plantain', pricing_model: 'fixed', price: 4500, duration_text: 'Dine-in/takeout' },
      { title: 'Egusi Soup with Pounded Yam', description: 'Rich egusi soup with assorted meat', pricing_model: 'fixed', price: 5200, duration_text: 'Dine-in/takeout' },
      { title: 'Pepper Soup Special', description: 'Spicy goat meat or catfish pepper soup', pricing_model: 'fixed', price: 4800, duration_text: 'Dine-in/takeout' },
      { title: 'Ofada Rice & Ayamase Stew', description: 'Local rice with designer stew', pricing_model: 'fixed', price: 5500, duration_text: 'Dine-in/takeout' },
    ],
    'Brew & Bites Café': [
      { title: 'Avocado Toast & Latte', description: 'Sourdough with avocado, poached egg', pricing_model: 'fixed', price: 4800, duration_text: 'Breakfast' },
      { title: 'Classic Eggs Benedict', description: 'Poached eggs with hollandaise', pricing_model: 'fixed', price: 5500, duration_text: 'Brunch' },
      { title: 'Gourmet Burger & Coffee', description: 'Wagyu beef burger with fries', pricing_model: 'fixed', price: 6200, duration_text: 'Lunch' },
    ],
    'Spice Route Kitchen': [
      { title: 'Pad Thai with Prawns', description: 'Thai stir-fried noodles', pricing_model: 'fixed', price: 7500, duration_text: 'Lunch/Dinner' },
      { title: 'Sushi Platter', description: '24 pieces assorted', pricing_model: 'fixed', price: 12500, duration_text: 'Lunch/Dinner' },
      { title: 'Kung Pao Chicken', description: 'Spicy Sichuan-style chicken', pricing_model: 'fixed', price: 6800, duration_text: 'Lunch/Dinner' },
      { title: 'Beef Ramen Bowl', description: 'Rich tonkotsu broth with beef', pricing_model: 'fixed', price: 8200, duration_text: 'Lunch/Dinner' },
    ],
    'DesignPro Studio': [
      { title: 'Complete Brand Identity', description: 'Logo, colors, typography, guidelines', pricing_model: 'fixed', price: 350000, duration_text: '3-4 weeks' },
      { title: 'Logo Design', description: '3 concepts, unlimited revisions', pricing_model: 'fixed', price: 85000, duration_text: '1-2 weeks' },
      { title: 'Social Media Graphics', description: '30 custom posts for all platforms', pricing_model: 'fixed', price: 120000, duration_text: '1 week' },
      { title: 'Print Design', description: 'Flyers, brochures, print-ready files', pricing_model: 'fixed', price: 45000, duration_text: '3-5 days' },
    ],
    'The Content Factory': [
      { title: 'SEO Blog Post Writing', description: 'Keyword-optimized 1000-1500 words', pricing_model: 'fixed', price: 25000, duration_text: '3-5 days' },
      { title: 'Website Content Package', description: 'Complete website copy, SEO-optimized', pricing_model: 'fixed', price: 180000, duration_text: '1-2 weeks' },
      { title: 'Product Descriptions', description: '10 compelling descriptions', pricing_model: 'fixed', price: 35000, duration_text: '2-3 days' },
      { title: 'Email Marketing Campaign', description: 'Series of 5 emails with CTAs', pricing_model: 'fixed', price: 95000, duration_text: '1 week' },
    ],
    'TutorHub Nigeria': [
      { title: 'WAEC/NECO Preparation', description: 'Exam prep per subject, 12 sessions', pricing_model: 'fixed', price: 48000, duration_text: '3 months' },
      { title: 'JAMB UTME Coaching', description: 'Comprehensive JAMB prep', pricing_model: 'fixed', price: 65000, duration_text: '2 months' },
      { title: 'Math Tutoring', description: 'Personalized math tutoring', pricing_model: 'hourly', price: 5000, duration_text: 'Per hour' },
      { title: 'English Language Tutoring', description: 'Grammar, writing, comprehension', pricing_model: 'hourly', price: 5000, duration_text: 'Per hour' },
    ],
    'SparkleClean Pro': [
      { title: 'Standard Home Cleaning', description: 'Complete home cleaning, 2-3 bedrooms', pricing_model: 'fixed', price: 18000, duration_text: '3-4 hours' },
      { title: 'Deep Cleaning Service', description: 'Intensive cleaning including appliances', pricing_model: 'fixed', price: 35000, duration_text: 'Full day' },
      { title: 'Office Cleaning', description: 'Office spaces up to 200 sqm', pricing_model: 'fixed', price: 25000, duration_text: '2-3 hours' },
      { title: 'Post-Construction Cleaning', description: 'Remove dust, debris, paint marks', pricing_model: 'fixed', price: 65000, duration_text: 'Full day' },
    ],
    'EventMasters Nigeria': [
      { title: 'Wedding Planning', description: 'Full service for 200-300 guests', pricing_model: 'fixed', price: 1500000, duration_text: '3-6 months' },
      { title: 'Corporate Event Management', description: 'Product launches, conferences', pricing_model: 'fixed', price: 850000, duration_text: '1-3 months' },
      { title: 'Birthday Party Planning', description: 'Theme development, decor, entertainment', pricing_model: 'fixed', price: 380000, duration_text: '1 month' },
      { title: 'Event Day Coordination', description: 'Professional coordinator for event day', pricing_model: 'fixed', price: 150000, duration_text: 'Event day' },
    ],
    'SnapShot Photography': [
      { title: 'Wedding Photography Package', description: 'Full-day, 2 photographers, 500+ photos', pricing_model: 'fixed', price: 450000, duration_text: 'Full day' },
      { title: 'Event Photography', description: '4 hours coverage, 200+ photos', pricing_model: 'fixed', price: 120000, duration_text: '4 hours' },
      { title: 'Portrait Photography', description: '1 hour session, 30 edited photos', pricing_model: 'fixed', price: 45000, duration_text: '1 hour' },
      { title: 'Product Photography', description: '20 products, e-commerce ready', pricing_model: 'fixed', price: 65000, duration_text: '2-3 hours' },
    ],
  };

  const services = serviceData[businessName] || [];
  if (services.length === 0) return 0;

  let inserted = 0;
  for (const service of services) {
    const { error } = await supabase.from('service_listings').insert({
      business_profile_id: businessId,
      title: service.title,
      description: service.description,
      pricing_model: service.pricing_model,
      price: service.price > 0 ? service.price : null,
      currency: 'NGN',
      duration_text: service.duration_text,
      is_active: true,
      is_featured: Math.random() > 0.7,
    });
    if (!error) inserted++;
  }

  return inserted;
}

addProductsAndServices()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
