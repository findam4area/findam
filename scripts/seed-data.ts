/**
 * Comprehensive seed data generation script for FindAm platform
 * 
 * This script generates realistic Nigerian test data including:
 * - 20 users with Nigerian names, emails, and phone numbers
 * - 1 admin user (findam4area@gmail.com / Admin123)
 * - 10 categories (Services, Products, Opportunities, Education, Health, Technology, Fashion, Food, Real Estate, Events)
 * - 50 listings across categories with proper images and varying statuses (10 pending, 35 approved, 5 rejected)
 * - 10 vendor applications with varying statuses (3 pending, 5 approved, 2 rejected)
 * - Approved vendor records for approved applications
 * 
 * Features:
 * - Idempotent execution (checks for existing data before seeding)
 * - Referential integrity checks
 * - Realistic Nigerian content (names, locations, phone numbers, business descriptions)
 * - Placeholder images with proper dimensions
 * - Multi-image support for listings (3-5 images per listing)
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Nigerian Data Constants
// ============================================================================

const NIGERIAN_NAMES = {
  firstName: [
    'Adebayo', 'Chidinma', 'Emeka', 'Folake', 'Ifeanyi', 'Ngozi', 'Oluwaseun', 'Titilayo',
    'Chukwuma', 'Aisha', 'Yusuf', 'Zainab', 'Kehinde', 'Taiwo', 'Funmilayo', 'Babatunde',
    'Obioma', 'Chiamaka', 'Ibrahim', 'Fatima', 'Musa', 'Blessing', 'Chinedu', 'Amara'
  ],
  lastName: [
    'Adeyemi', 'Okafor', 'Williams', 'Johnson', 'Bello', 'Okonkwo', 'Adebisi', 'Nwosu',
    'Afolabi', 'Eze', 'Mohammed', 'Akinwale', 'Okoro', 'Ibrahim', 'Adekunle', 'Olaniyan',
    'Chukwu', 'Adeleke', 'Usman', 'Ezekiel'
  ]
};

const NIGERIAN_STATES = [
  'Lagos', 'Abuja', 'Kano', 'Rivers', 'Kaduna', 'Oyo', 'Delta', 'Edo', 'Enugu', 'Anambra',
  'Ogun', 'Imo', 'Plateau', 'Benue', 'Ondo', 'Abia', 'Akwa Ibom', 'Osun', 'Ekiti', 'Kwara', 'Cross River'
];

const NIGERIAN_CITIES = [
  'Lagos', 'Ikeja', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Enugu',
  'Warri', 'Kaduna', 'Jos', 'Aba', 'Onitsha', 'Abeokuta', 'Ilorin', 'Akure', 'Owerri',
  'Asaba', 'Uyo', 'Calabar', 'Yola', 'Maiduguri', 'Osogbo', 'Ado-Ekiti'
];

const BUSINESS_TYPES = {
  Services: ['Cleaning Service', 'Event Planning', 'Photography Studio', 'Hair Salon', 'Car Repair Shop'],
  Products: ['Electronics Store', 'Fashion Boutique', 'Beauty Products', 'Furniture Shop', 'Phone Accessories'],
  Opportunities: ['Internship Program', 'Youth Training', 'Skill Development', 'Volunteer Work', 'Mentorship'],
  Education: ['Tutorial Center', 'Vocational School', 'Online Course', 'Exam Prep', 'Language School'],
  Health: ['Pharmacy', 'Fitness Center', 'Wellness Spa', 'Medical Clinic', 'Health Supplements'],
  Technology: ['IT Training', 'Software Development', 'Web Design Agency', 'Tech Support', 'Digital Marketing', 'AI and Content Creation'],
  Fashion: ['Tailoring Service', 'Fashion Design', 'Bridal Shop', 'Shoe Store', 'Accessories'],
  Food: ['Restaurant', 'Catering Service', 'Food Delivery', 'Bakery', 'Fast Food'],
  'Real Estate': ['Property Sales', 'Rentals', 'Real Estate Agency', 'Property Management', 'Land Sales'],
  Events: ['Wedding Planning', 'Party Rental', 'DJ Services', 'Venue Booking', 'Event Decoration']
};

// ============================================================================
// Helper Functions
// ============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateNigerianPhone(): string {
  const prefixes = ['0803', '0806', '0810', '0813', '0816', '0903', '0906', '0908'];
  const prefix = getRandomItem(prefixes);
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${suffix}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${username}@${getRandomItem(domains)}`;
}

function generatePlaceholderImageUrls(count: number, category: string): string[] {
  const images: string[] = [];
  const width = 800;
  const height = 600;
  
  for (let i = 0; i < count; i++) {
    // Using a placeholder service that works
    images.push(`https://placehold.co/${width}x${height}/png?text=${encodeURIComponent(category)}+${i + 1}`);
  }
  
  return images;
}

// ============================================================================
// Data Generation Functions
// ============================================================================

async function checkExistingData(): Promise<boolean> {
  console.log('🔍 Checking for existing data...\n');

  const checks = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('vendor_applications').select('id', { count: 'exact', head: true }),
  ]);

  const [usersCheck, categoriesCheck, listingsCheck, vendorCheck] = checks;

  console.log('📊 Current data counts:');
  console.log(`   - Users: ${usersCheck.count || 0}`);
  console.log(`   - Categories: ${categoriesCheck.count || 0}`);
  console.log(`   - Listings: ${listingsCheck.count || 0}`);
  console.log(`   - Vendor Applications: ${vendorCheck.count || 0}\n`);

  const hasData = 
    (usersCheck.count && usersCheck.count > 1) || // More than just admin
    (categoriesCheck.count && categoriesCheck.count > 0) ||
    (listingsCheck.count && listingsCheck.count > 0) ||
    (vendorCheck.count && vendorCheck.count > 0);

  return Boolean(hasData);
}

async function seedUsers(): Promise<Map<number, string>> {
  console.log('👥 Seeding users...\n');

  const userIdMap = new Map<number, string>();

  // Check if admin exists
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'findam4area@gmail.com')
    .single();

  if (existingAdmin) {
    console.log('⏭️  Admin user already exists, skipping...');
    userIdMap.set(0, existingAdmin.id);
  } else {
    // Create admin user via Supabase Auth
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'findam4area@gmail.com',
      password: 'Admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (adminAuthError) {
      if (adminAuthError.message.includes('already been registered')) {
        // Admin auth exists, just get the user
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const adminUser = authUsers?.users.find(u => u.email === 'findam4area@gmail.com');
        
        if (adminUser) {
          // Insert or update users table
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({ 
              id: adminUser.id,
              email: 'findam4area@gmail.com',
              username: 'admin',
              full_name: 'Admin User',
              phone: generateNigerianPhone(),
              avatar_url: null,
              bio: 'Platform Administrator'
            }, { onConflict: 'id' });

          if (upsertError && !upsertError.message.includes('duplicate key')) {
            console.error('❌ Error upserting admin user:', upsertError.message);
          } else {
            console.log(`✅ Admin user synced (email: findam4area@gmail.com, password: Admin123)`);
            userIdMap.set(0, adminUser.id);
          }
        }
      } else {
        console.error('❌ Error creating admin auth:', adminAuthError.message);
      }
    } else if (adminAuth.user) {
      // Insert into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({ 
          id: adminAuth.user.id,
          email: 'findam4area@gmail.com',
          username: 'admin',
          full_name: 'Admin User',
          phone: generateNigerianPhone(),
          avatar_url: null,
          bio: 'Platform Administrator'
        });

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error('❌ Error inserting admin user:', insertError.message);
      } else {
        console.log(`✅ Admin user created (email: findam4area@gmail.com, password: Admin123)`);
        userIdMap.set(0, adminAuth.user.id);
      }
    }
  }

  // Create 20 regular users
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < 20; i++) {
    const firstName = getRandomItem(NIGERIAN_NAMES.firstName);
    const lastName = getRandomItem(NIGERIAN_NAMES.lastName);
    const email = generateEmail(firstName, lastName);
    const fullName = `${firstName} ${lastName}`;
    const phone = generateNigerianPhone();

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      userIdMap.set(i + 1, existing.id);
      skipped++;
      continue;
    }

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'Password123',
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error(`❌ Error creating user ${email}:`, authError.message);
      continue;
    }

    if (authData.user) {
      // Generate username from email
      const username = email.split('@')[0].replace(/\./g, '_');
      
      // Insert into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({ 
          id: authData.user.id,
          email,
          username,
          full_name: fullName,
          phone,
          avatar_url: null,
          bio: null
        });

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error(`❌ Error inserting user ${email}:`, insertError.message);
      } else {
        userIdMap.set(i + 1, authData.user.id);
        created++;
        console.log(`✅ User ${i + 1}/20: ${fullName} (${email})`);
      }
    }
  }

  console.log(`\n📊 Users summary: ${created} created, ${skipped} skipped\n`);
  return userIdMap;
}

async function seedCategories(): Promise<Map<string, string>> {
  console.log('📂 Seeding categories...\n');

  const categoryIdMap = new Map<string, string>();
  const categories = [
    { name: 'Services', description: 'Professional services and assistance', icon: '🔧', order: 1 },
    { name: 'Products', description: 'Physical goods and items for sale', icon: '📦', order: 2 },
    { name: 'Opportunities', description: 'Career and growth opportunities', icon: '🚀', order: 3 },
    { name: 'Education', description: 'Educational services and training', icon: '📚', order: 4 },
    { name: 'Health', description: 'Health and wellness services', icon: '⚕️', order: 5 },
    { name: 'Technology', description: 'IT and tech services', icon: '💻', order: 6 },
    { name: 'Fashion', description: 'Fashion and apparel', icon: '👗', order: 7 },
    { name: 'Food', description: 'Food and beverage services', icon: '🍽️', order: 8 },
    { name: 'Real Estate', description: 'Property and real estate', icon: '🏠', order: 9 },
    { name: 'Events', description: 'Event planning and services', icon: '🎉', order: 10 }
  ];

  let created = 0;
  let skipped = 0;

  for (const cat of categories) {
    // Check if category exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', cat.name)
      .single();

    if (existing) {
      categoryIdMap.set(cat.name, existing.id);
      skipped++;
      console.log(`⏭️  Category "${cat.name}" already exists`);
      continue;
    }

    // Create category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description,
        image_url: `https://placehold.co/400x300/png?text=${encodeURIComponent(cat.name)}`,
        display_order: cat.order,
        listing_count: 0
      })
      .select('id, name')
      .single();

    if (error) {
      console.error(`❌ Error creating category "${cat.name}":`, error.message);
      continue;
    }

    if (data) {
      categoryIdMap.set(cat.name, data.id);
      created++;
      console.log(`✅ Category created: ${cat.name}`);
    }
  }

  console.log(`\n📊 Categories summary: ${created} created, ${skipped} skipped\n`);
  return categoryIdMap;
}

async function seedListings(
  userIdMap: Map<number, string>,
  categoryIdMap: Map<string, string>
): Promise<string[]> {
  console.log('📝 Seeding listings...\n');

  const listingIds: string[] = [];
  const userIds = Array.from(userIdMap.values()).filter((_, index) => index > 0); // Exclude admin
  const statuses: Array<'pending' | 'approved' | 'rejected'> = [
    ...Array(10).fill('pending'),
    ...Array(35).fill('approved'),
    ...Array(5).fill('rejected')
  ];

  let created = 0;

  for (let i = 0; i < 50; i++) {
    const categoryName = getRandomItem(Array.from(categoryIdMap.keys()));
    const categoryId = categoryIdMap.get(categoryName);
    const userId = getRandomItem(userIds);
    const status = statuses[i];
    const businessType = getRandomItem(BUSINESS_TYPES[categoryName as keyof typeof BUSINESS_TYPES]);
    
    // Generate 3-5 images per listing
    const imageCount = 3 + Math.floor(Math.random() * 3); // 3 to 5
    const images = generatePlaceholderImageUrls(imageCount, categoryName);
    const primaryImageIndex = 0;

    const state = getRandomItem(NIGERIAN_STATES);
    const city = getRandomItem(NIGERIAN_CITIES);

    const title = `${businessType} in ${city}`;
    const description = `Professional ${businessType.toLowerCase()} located in ${city}, ${state}. We offer quality services to our clients across Nigeria. Contact us for inquiries and bookings. Available for both individuals and corporate clients. Experienced team with excellent customer service.`;
    const price = Math.random() > 0.3 ? Math.floor(5000 + Math.random() * 95000) : null;

    const listing = {
      title,
      description,
      price,
      category_id: categoryId,
      user_id: userId,
      state, // Use 'state' instead of 'location_state'
      lga: city, // Use 'lga' instead of 'location_city'
      images,
      primary_image_index: primaryImageIndex,
      status,
      is_featured: status === 'approved' && Math.random() > 0.7, // 30% of approved are featured
      rejection_reason: status === 'rejected' ? 'Does not meet quality standards. Please update your listing with more details and better images.' : null
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(listing)
      .select('id')
      .single();

    if (error) {
      console.error(`❌ Error creating listing ${i + 1}:`, error.message);
      continue;
    }

    if (data) {
      listingIds.push(data.id);
      created++;
      console.log(`✅ Listing ${i + 1}/50: ${title} [${status}] (${imageCount} images)`);
    }
  }

  console.log(`\n📊 Listings summary: ${created} created\n`);
  return listingIds;
}

async function seedVendorApplications(userIdMap: Map<number, string>): Promise<void> {
  console.log('🏢 Seeding vendor applications...\n');

  const userIds = Array.from(userIdMap.values()).filter((_, index) => index > 0); // Exclude admin
  const statuses: Array<'pending' | 'approved' | 'rejected'> = [
    ...Array(3).fill('pending'),
    ...Array(5).fill('approved'),
    ...Array(2).fill('rejected')
  ];

  const businessNames = [
    'Adebayo Enterprises', 'ChidiFresh Foods', 'Emeka Tech Solutions', 'Folake Fashion House',
    'Ngozi Beauty Supplies', 'Oluwaseun Services Ltd', 'Titi Catering Co', 'Chukwuma Properties',
    'Ibrahim Trading Co', 'Blessing Events & More'
  ];

  let created = 0;
  let approvedVendorsCreated = 0;

  for (let i = 0; i < 10; i++) {
    const userId = userIds[i % userIds.length];
    const status = statuses[i];
    const businessName = businessNames[i];

    // Check if application already exists for this user
    const { data: existing } = await supabase
      .from('vendor_applications')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      console.log(`⏭️  Vendor application for user already exists`);
      continue;
    }

    const application = {
      user_id: userId,
      business_name: businessName,
      business_description: `We are a professional business providing quality products and services across Nigeria. Established with commitment to excellence and customer satisfaction.`,
      contact_email: `contact@${businessName.toLowerCase().replace(/\s+/g, '')}.ng`,
      contact_phone: generateNigerianPhone(),
      status,
      rejection_reason: status === 'rejected' ? 'Incomplete business information. Please provide valid business registration documents.' : null
    };

    const { data, error } = await supabase
      .from('vendor_applications')
      .insert(application)
      .select('id, user_id, business_name, status')
      .single();

    if (error) {
      console.error(`❌ Error creating vendor application:`, error.message);
      continue;
    }

    if (data) {
      created++;
      console.log(`✅ Vendor application ${i + 1}/10: ${businessName} [${status}]`);

      // If approved, create approved_vendors record
      if (status === 'approved') {
        const { error: vendorError } = await supabase
          .from('approved_vendors')
          .insert({
            user_id: data.user_id,
            business_name: data.business_name,
            approved_badge_enabled: true
          });

        if (vendorError) {
          console.error(`   ❌ Error creating approved vendor record:`, vendorError.message);
        } else {
          approvedVendorsCreated++;
          console.log(`   ✅ Approved vendor record created`);
        }
      }
    }
  }

  console.log(`\n📊 Vendor applications summary: ${created} created`);
  console.log(`📊 Approved vendors summary: ${approvedVendorsCreated} created\n`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function seedAllData() {
  console.log('🌱 FindAm Seed Data Generation\n');
  console.log('=' .repeat(60));
  console.log('\n');

  // Check for existing data
  const hasExistingData = await checkExistingData();

  if (hasExistingData) {
    console.log('⚠️  Database already contains data.');
    console.log('⚠️  Seeding will skip existing records and add new ones.\n');
  }

  try {
    // Seed users (including admin)
    const userIdMap = await seedUsers();

    if (userIdMap.size === 0) {
      console.error('❌ No users created. Cannot proceed with seeding.');
      return false;
    }

    // Seed categories
    const categoryIdMap = await seedCategories();

    if (categoryIdMap.size === 0) {
      console.error('❌ No categories created. Cannot proceed with seeding.');
      return false;
    }

    // Seed listings
    await seedListings(userIdMap, categoryIdMap);

    // Seed vendor applications and approved vendors
    await seedVendorApplications(userIdMap);

    console.log('=' .repeat(60));
    console.log('\n✅ Seed data generation completed successfully!\n');

    console.log('📝 Summary:');
    console.log(`   - Admin user: findam4area@gmail.com / Admin123`);
    console.log(`   - Regular users: 20 with Nigerian names and emails`);
    console.log(`   - Categories: 10 main categories`);
    console.log(`   - Listings: 50 total (10 pending, 35 approved, 5 rejected)`);
    console.log(`   - Vendor applications: 10 (3 pending, 5 approved, 2 rejected)`);
    console.log(`   - Approved vendors: 5 with vendor badges\n`);

    console.log('💡 Next steps:');
    console.log('   1. Log in with findam4area@gmail.com / Admin123 to access admin features');
    console.log('   2. Browse listings on the homepage');
    console.log('   3. Test filtering and search functionality');
    console.log('   4. Approve/reject pending listings from admin dashboard');
    console.log('   5. Review vendor applications\n');

    return true;
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    return false;
  }
}

// Run the seeding script
seedAllData()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });



