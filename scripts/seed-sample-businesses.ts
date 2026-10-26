/**
 * Script to seed sample businesses into the database
 * 
 * This script creates 18 diverse sample businesses across different niches
 * to showcase the marketplace with realistic data.
 * 
 * Features:
 * - Idempotent execution (skips existing businesses)
 * - Creates sample user if needed
 * - Seeds business profiles with complete data
 * - Seeds 4-5 products/services per business
 * - Seeds sample reviews with realistic ratings
 * - Handles transactions for data consistency
 */

import { createClient } from '@supabase/supabase-js';

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

// Helper to get random date in last 6 months
function getRandomDateInLast6Months(): Date {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

// Helper to get random rating between 4.4 and 4.9
function getRandomRating(): number {
  return Number((4.4 + Math.random() * 0.5).toFixed(2));
}

// Helper to get random review count between 150 and 800
function getRandomReviewCount(): number {
  return Math.floor(150 + Math.random() * 650);
}

// Sample business data
const sampleBusinesses = [
  // Tech Niche (3 businesses)
  {
    business_name: 'TechHub Nigeria',
    description: 'Premium electronics retailer specializing in laptops, smartphones, and accessories. We offer genuine products with full warranty coverage and expert technical support.',
    business_type: 'product' as const,
    categoryName: 'Technology & IT',
    subcategoryName: 'Hardware Repair',
    city: 'Lagos',
    state: 'Lagos',
    address: '45 Allen Avenue, Ikeja',
    phone: '+234 803 456 7890',
    email: 'info@techhubnigeria.com',
    website: 'https://techhubnigeria.com',
    coordinates: { lat: 6.6018, lng: 3.3515 },
    price_range: '$$$' as const,
    is_premium: true,
    premium_tier: 'pro' as const,
    products: [
      { title: 'MacBook Pro M3 16-inch', description: 'Latest Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Brand new with international warranty.', price: 2850000, product_type: 'physical' as const, stock_quantity: 5 },
      { title: 'iPhone 15 Pro Max', description: '256GB, all colors available. Genuine Apple warranty, accessories included.', price: 1450000, product_type: 'physical' as const, stock_quantity: 12 },
      { title: 'Samsung Galaxy S24 Ultra', description: '512GB storage, S-Pen included. Premium flagship with 2-year warranty.', price: 1250000, product_type: 'physical' as const, stock_quantity: 8 },
      { title: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation, 30-hour battery life, premium comfort.', price: 285000, product_type: 'physical' as const, stock_quantity: 15 },
      { title: 'Dell XPS 15 Laptop', description: 'Intel i7, 16GB RAM, 1TB SSD, 15.6" 4K display. Perfect for professionals.', price: 1650000, product_type: 'physical' as const, stock_quantity: 6 },
    ]
  },
  {
    business_name: 'GadgetZone Abuja',
    description: 'Your one-stop shop for smart home devices and gaming accessories. We bring the latest tech innovations to Abuja at competitive prices.',
    business_type: 'product' as const,
    categoryName: 'Retail & Shopping',
    subcategoryName: 'Electronics',
    city: 'Abuja',
    state: 'FCT',
    address: '23 Gimbiya Street, Area 11, Garki',
    phone: '+234 805 123 4567',
    email: 'sales@gadgetzone.ng',
    website: 'https://gadgetzone.ng',
    coordinates: { lat: 9.0579, lng: 7.4951 },
    price_range: '$$' as const,
    is_premium: false,
    products: [
      { title: 'PlayStation 5 Console', description: 'PS5 with 2 controllers, FIFA 24, and 1TB storage. Ready to play bundle.', price: 865000, product_type: 'physical' as const, stock_quantity: 4 },
      { title: 'Ring Video Doorbell Pro', description: 'Smart doorbell with HD video, motion detection, two-way audio.', price: 145000, product_type: 'physical' as const, stock_quantity: 20 },
      { title: 'Amazon Echo Dot (5th Gen)', description: 'Smart speaker with Alexa, improved sound quality, voice control for smart home.', price: 48000, product_type: 'physical' as const, stock_quantity: 35 },
      { title: 'Logitech G Pro Wireless Mouse', description: 'Professional gaming mouse, ultra-lightweight, 25K DPI sensor.', price: 95000, product_type: 'physical' as const, stock_quantity: 18 },
    ]
  },
  {
    business_name: 'CodeCraft Academy',
    description: 'Professional software training and IT consulting services. We offer courses in web development, mobile apps, cloud computing, and cybersecurity.',
    business_type: 'service' as const,
    categoryName: 'Education & Training',
    subcategoryName: 'Vocational Training',
    city: 'Lagos',
    state: 'Lagos',
    address: '12B Admiralty Way, Lekki Phase 1',
    phone: '+234 807 234 5678',
    email: 'academy@codecraft.ng',
    website: 'https://codecraft.ng',
    coordinates: { lat: 6.4396, lng: 3.5254 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'basic' as const,
    services: [
      { title: 'Full-Stack Web Development Bootcamp', description: '16-week intensive program covering HTML, CSS, JavaScript, React, Node.js, databases. Job placement assistance included.', pricing_model: 'fixed' as const, price: 450000, duration_text: '16 weeks' },
      { title: 'Mobile App Development with React Native', description: 'Build iOS and Android apps with React Native. 12-week course with hands-on projects.', pricing_model: 'fixed' as const, price: 380000, duration_text: '12 weeks' },
      { title: 'Cloud Computing (AWS/Azure) Certification', description: 'Prepare for AWS or Azure certification. Expert instructors, practice exams, real-world projects.', pricing_model: 'fixed' as const, price: 320000, duration_text: '8 weeks' },
      { title: 'IT Consulting for Businesses', description: 'Technology strategy, system architecture, digital transformation consulting.', pricing_model: 'hourly' as const, price: 35000, duration_text: 'Per hour' },
      { title: 'Cybersecurity Fundamentals', description: 'Learn ethical hacking, network security, risk management. CompTIA Security+ prep included.', pricing_model: 'fixed' as const, price: 280000, duration_text: '10 weeks' },
    ]
  },
  
  // Auto Niche (3 businesses)
  {
    business_name: 'AutoParts Express',
    description: 'Premium supplier of genuine auto parts with manufacturer warranty. We stock parts for all major car brands with same-day delivery in Lagos.',
    business_type: 'product' as const,
    categoryName: 'Automotive',
    subcategoryName: 'Auto Parts',
    city: 'Lagos',
    state: 'Lagos',
    address: '78 Oshodi-Apapa Expressway, Isolo',
    phone: '+234 809 345 6789',
    email: 'parts@autopartsexpress.ng',
    website: 'https://autopartsexpress.ng',
    coordinates: { lat: 6.5244, lng: 3.3392 },
    price_range: '$$' as const,
    is_premium: false,
    products: [
      { title: 'Bosch Car Battery 75Ah', description: 'Premium maintenance-free battery, 3-year warranty, fits most sedans.', price: 85000, product_type: 'physical' as const, stock_quantity: 25 },
      { title: 'Michelin Pilot Sport Tires (Set of 4)', description: '225/45R17 premium performance tires, excellent grip and durability.', price: 320000, product_type: 'physical' as const, stock_quantity: 12 },
      { title: 'Denso Brake Pads (Toyota/Lexus)', description: 'OEM-quality ceramic brake pads, low dust, quiet operation.', price: 45000, product_type: 'physical' as const, stock_quantity: 40 },
      { title: 'Mann Air Filter Kit', description: 'High-flow air filter for better engine performance, fits most vehicles.', price: 18000, product_type: 'physical' as const, stock_quantity: 55 },
      { title: 'Mobil 1 Synthetic Oil (5 Liters)', description: 'Full synthetic motor oil 5W-30, advanced engine protection.', price: 28000, product_type: 'physical' as const, stock_quantity: 60 },
    ]
  },
  {
    business_name: 'Elite Auto Detailing',
    description: 'Premium car wash and detailing services. We use eco-friendly products and advanced techniques to make your car look showroom new.',
    business_type: 'service' as const,
    categoryName: 'Automotive',
    subcategoryName: 'Car Wash',
    city: 'Abuja',
    state: 'FCT',
    address: '56 Ademola Adetokunbo Crescent, Wuse 2',
    phone: '+234 806 789 0123',
    email: 'elite@autodetailing.ng',
    website: 'https://eliteautodetailing.ng',
    coordinates: { lat: 9.0765, lng: 7.4861 },
    price_range: '$$$' as const,
    is_premium: true,
    premium_tier: 'pro' as const,
    services: [
      { title: 'Premium Exterior Detailing', description: 'Hand wash, clay bar treatment, polish, wax, tire dressing, glass cleaning. Show-quality finish.', pricing_model: 'fixed' as const, price: 45000, duration_text: '3-4 hours' },
      { title: 'Interior Deep Cleaning', description: 'Vacuum, steam clean, leather conditioning, odor removal, dashboard polish.', pricing_model: 'fixed' as const, price: 35000, duration_text: '2-3 hours' },
      { title: 'Complete Detailing Package', description: 'Full exterior and interior detailing, engine bay cleaning, headlight restoration.', pricing_model: 'fixed' as const, price: 75000, duration_text: '5-6 hours' },
      { title: 'Ceramic Coating Application', description: 'Professional-grade ceramic coating for long-lasting protection and shine. Lasts 2-3 years.', pricing_model: 'fixed' as const, price: 185000, duration_text: 'Full day' },
    ]
  },
  {
    business_name: 'MechaniPro Garage',
    description: 'Expert auto repair and maintenance services by certified technicians. We specialize in Japanese and European vehicles with diagnostic equipment.',
    business_type: 'service' as const,
    categoryName: 'Automotive',
    subcategoryName: 'Auto Repair',
    city: 'Lagos',
    state: 'Lagos',
    address: '34 Opebi Road, Ikeja',
    phone: '+234 808 456 7890',
    email: 'service@mechanipro.ng',
    website: 'https://mechanipro.ng',
    coordinates: { lat: 6.5965, lng: 3.3571 },
    price_range: '$$' as const,
    is_premium: false,
    services: [
      { title: 'Comprehensive Vehicle Inspection', description: 'Full 50-point inspection with diagnostic scan, written report, and recommendations.', pricing_model: 'fixed' as const, price: 15000, duration_text: '1-2 hours' },
      { title: 'Engine Diagnostics & Repair', description: 'Computer diagnostics, engine troubleshooting, repairs by certified mechanics.', pricing_model: 'custom' as const, price: 0, duration_text: 'Varies by issue' },
      { title: 'Brake System Service', description: 'Brake inspection, pad replacement, rotor resurfacing, fluid flush.', pricing_model: 'fixed' as const, price: 65000, duration_text: '2-3 hours' },
      { title: 'AC System Service & Repair', description: 'AC diagnostic, refrigerant recharge, compressor repair, leak detection.', pricing_model: 'fixed' as const, price: 45000, duration_text: '2-3 hours' },
      { title: 'Transmission Service', description: 'Transmission fluid change, filter replacement, full system inspection.', pricing_model: 'fixed' as const, price: 55000, duration_text: '2-3 hours' },
    ]
  },
  
  // Fashion Niche (3 businesses)
  {
    business_name: 'StyleHub Boutique',
    description: 'Trendy men and women fashion from local and international brands. We curate the latest styles for the modern Nigerian professional.',
    business_type: 'product' as const,
    categoryName: 'Fashion & Beauty',
    subcategoryName: 'Boutiques',
    city: 'Lagos',
    state: 'Lagos',
    address: '15 Admiralty Way, Lekki Phase 1',
    phone: '+234 810 234 5678',
    email: 'shop@stylehub.ng',
    website: 'https://stylehub.ng',
    coordinates: { lat: 6.4367, lng: 3.5235 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'basic' as const,
    products: [
      { title: 'Men\'s Designer Kaftan Set', description: 'Premium senator kaftan with embroidery, matching cap. Perfect for special occasions.', price: 85000, product_type: 'physical' as const, stock_quantity: 15 },
      { title: 'Women\'s Ankara Midi Dress', description: 'Vibrant African print dress, fitted bodice, flared skirt. Multiple sizes available.', price: 45000, product_type: 'physical' as const, stock_quantity: 30 },
      { title: 'Men\'s Fitted Suit (3-Piece)', description: 'Slim-fit suit jacket, vest, trousers. Italian wool blend, custom alterations included.', price: 125000, product_type: 'physical' as const, stock_quantity: 8 },
      { title: 'Women\'s Leather Handbag', description: 'Genuine leather tote bag, spacious interior, gold hardware. Designer quality.', price: 75000, product_type: 'physical' as const, stock_quantity: 12 },
      { title: 'Unisex Luxury Watch', description: 'Stainless steel chronograph watch, sapphire crystal, water-resistant to 100m.', price: 95000, product_type: 'physical' as const, stock_quantity: 10 },
    ]
  },
  {
    business_name: 'Gele & Lace Palace',
    description: 'Authentic Nigerian fabrics and traditional attire. We specialize in premium gele, lace, ankara, and aso-oke for weddings and special events.',
    business_type: 'product' as const,
    categoryName: 'Fashion & Beauty',
    subcategoryName: 'Boutiques',
    city: 'Abuja',
    state: 'FCT',
    address: '89 Ahmadu Bello Way, Central Business District',
    phone: '+234 811 345 6789',
    email: 'info@geleandlace.ng',
    website: 'https://geleandlace.ng',
    coordinates: { lat: 9.0643, lng: 7.4892 },
    price_range: '$$' as const,
    is_premium: false,
    products: [
      { title: 'Premium Aso-Oke Fabric (5 yards)', description: 'Hand-woven aso-oke in royal blue with gold threading. Perfect for owambe.', price: 145000, product_type: 'physical' as const, stock_quantity: 8 },
      { title: 'French Lace (5 yards)', description: 'Imported French lace with stones and sequins, multiple colors available.', price: 95000, product_type: 'physical' as const, stock_quantity: 20 },
      { title: 'Ready-Made Gele (Auto-Gele)', description: 'Pre-tied gele, easy to wear, maintains shape all day. Various colors.', price: 25000, product_type: 'physical' as const, stock_quantity: 40 },
      { title: 'Ankara Print Fabric (6 yards)', description: 'Vibrant African wax print, colorfast, premium quality. Perfect for any style.', price: 18000, product_type: 'physical' as const, stock_quantity: 60 },
    ]
  },
  {
    business_name: 'FootWear Kingdom',
    description: 'Premium shoes and bags for men and women. We import quality footwear from Italy, Spain, and Turkey at affordable prices.',
    business_type: 'product' as const,
    categoryName: 'Fashion & Beauty',
    subcategoryName: 'Boutiques',
    city: 'Lagos',
    state: 'Lagos',
    address: '45 Bode Thomas Street, Surulere',
    phone: '+234 812 456 7890',
    email: 'sales@footwearkingdom.ng',
    website: 'https://footwearkingdom.ng',
    coordinates: { lat: 6.4969, lng: 3.3553 },
    price_range: '$$' as const,
    is_premium: false,
    products: [
      { title: 'Men\'s Italian Leather Oxfords', description: 'Genuine leather dress shoes, handcrafted in Italy, sizes 40-46 available.', price: 65000, product_type: 'physical' as const, stock_quantity: 18 },
      { title: 'Women\'s Designer Heels', description: 'Elegant stiletto heels, 4-inch height, comfortable padding, party-ready.', price: 48000, product_type: 'physical' as const, stock_quantity: 25 },
      { title: 'Men\'s Casual Sneakers', description: 'Turkish-made casual sneakers, breathable material, trendy design.', price: 35000, product_type: 'physical' as const, stock_quantity: 35 },
      { title: 'Women\'s Leather Crossbody Bag', description: 'Compact leather bag with adjustable strap, perfect for everyday use.', price: 42000, product_type: 'physical' as const, stock_quantity: 20 },
      { title: 'Men\'s Leather Loafers', description: 'Slip-on loafers, genuine leather, perfect for business casual.', price: 55000, product_type: 'physical' as const, stock_quantity: 22 },
    ]
  },
  
  // Eatery Niche (3 businesses)
  {
    business_name: 'Mama Put Deluxe',
    description: 'Authentic Nigerian cuisine with a modern twist. We serve traditional favorites prepared with fresh ingredients in a comfortable setting.',
    business_type: 'service' as const,
    categoryName: 'Food & Beverage',
    subcategoryName: 'Restaurants',
    city: 'Lagos',
    state: 'Lagos',
    address: '67 Awolowo Road, Ikoyi',
    phone: '+234 813 567 8901',
    email: 'dine@mamaputdeluxe.ng',
    website: 'https://mamaputdeluxe.ng',
    coordinates: { lat: 6.4541, lng: 3.4316 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'basic' as const,
    services: [
      { title: 'Jollof Rice & Grilled Chicken', description: 'Our signature party jollof rice with perfectly grilled chicken, coleslaw, and plantain.', pricing_model: 'fixed' as const, price: 4500, duration_text: 'Dine-in or takeout' },
      { title: 'Egusi Soup with Pounded Yam', description: 'Rich egusi soup with assorted meat, served with fresh pounded yam.', pricing_model: 'fixed' as const, price: 5200, duration_text: 'Dine-in or takeout' },
      { title: 'Pepper Soup Special', description: 'Spicy goat meat or catfish pepper soup with yam or plantain. Perfect comfort food.', pricing_model: 'fixed' as const, price: 4800, duration_text: 'Dine-in or takeout' },
      { title: 'Ofada Rice & Ayamase Stew', description: 'Local Ofada rice with designer stew (ayamase), assorted meat, and boiled eggs.', pricing_model: 'fixed' as const, price: 5500, duration_text: 'Dine-in or takeout' },
    ]
  },
  {
    business_name: 'Brew & Bites Café',
    description: 'Artisan coffee and gourmet brunch in a cozy atmosphere. We roast our own beans and source ingredients locally for fresh, quality meals.',
    business_type: 'both' as const,
    categoryName: 'Food & Beverage',
    subcategoryName: 'Cafes',
    city: 'Abuja',
    state: 'FCT',
    address: '34 Gana Street, Maitama',
    phone: '+234 814 678 9012',
    email: 'hello@brewandbites.ng',
    website: 'https://brewandbites.ng',
    coordinates: { lat: 9.0820, lng: 7.4951 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'pro' as const,
    services: [
      { title: 'Avocado Toast & Latte', description: 'Artisan sourdough with smashed avocado, poached egg, cherry tomatoes. Served with our signature latte.', pricing_model: 'fixed' as const, price: 4800, duration_text: 'Breakfast/Brunch' },
      { title: 'Classic Eggs Benedict', description: 'Poached eggs on English muffin with hollandaise, choice of bacon or smoked salmon.', pricing_model: 'fixed' as const, price: 5500, duration_text: 'Breakfast/Brunch' },
      { title: 'Gourmet Burger & Coffee', description: 'Wagyu beef burger with fries and specialty coffee of your choice.', pricing_model: 'fixed' as const, price: 6200, duration_text: 'Lunch/Dinner' },
    ],
    products: [
      { title: 'Brew & Bites Coffee Beans (250g)', description: 'Our signature medium roast, freshly roasted. Notes of chocolate and caramel.', price: 5500, product_type: 'physical' as const, stock_quantity: 50 },
      { title: 'House-Made Granola (500g)', description: 'Honey-roasted granola with nuts and dried fruits. Perfect for breakfast.', price: 3800, product_type: 'physical' as const, stock_quantity: 30 },
    ]
  },
  {
    business_name: 'Spice Route Kitchen',
    description: 'Authentic Asian fusion cuisine featuring Thai, Chinese, and Japanese dishes. Fresh ingredients, bold flavors, contemporary presentation.',
    business_type: 'service' as const,
    categoryName: 'Food & Beverage',
    subcategoryName: 'Restaurants',
    city: 'Lagos',
    state: 'Lagos',
    address: '28 Ozumba Mbadiwe Avenue, Victoria Island',
    phone: '+234 815 789 0123',
    email: 'reservations@spiceroute.ng',
    website: 'https://spiceroute.ng',
    coordinates: { lat: 6.4281, lng: 3.4219 },
    price_range: '$$$' as const,
    is_premium: true,
    premium_tier: 'pro' as const,
    services: [
      { title: 'Pad Thai with Prawns', description: 'Traditional Thai stir-fried noodles with succulent prawns, peanuts, bean sprouts.', pricing_model: 'fixed' as const, price: 7500, duration_text: 'Lunch/Dinner' },
      { title: 'Sushi Platter (24 pieces)', description: 'Assorted nigiri and maki rolls with fresh fish, wasabi, soy sauce, pickled ginger.', pricing_model: 'fixed' as const, price: 12500, duration_text: 'Lunch/Dinner' },
      { title: 'Kung Pao Chicken', description: 'Spicy Sichuan-style chicken with peanuts, vegetables, steamed rice.', pricing_model: 'fixed' as const, price: 6800, duration_text: 'Lunch/Dinner' },
      { title: 'Tom Yum Soup', description: 'Hot and sour Thai soup with prawns, mushrooms, lemongrass, aromatic herbs.', pricing_model: 'fixed' as const, price: 5500, duration_text: 'Starter' },
      { title: 'Beef Ramen Bowl', description: 'Rich tonkotsu broth, tender beef, soft-boiled egg, bamboo shoots, scallions.', pricing_model: 'fixed' as const, price: 8200, duration_text: 'Lunch/Dinner' },
    ]
  },
  
  // Skills Niche (3 businesses)
  {
    business_name: 'DesignPro Studio',
    description: 'Professional graphic design and branding services for businesses. We create memorable brand identities, marketing materials, and digital assets.',
    business_type: 'service' as const,
    categoryName: 'Professional Services',
    subcategoryName: 'Graphic Design',
    city: 'Lagos',
    state: 'Lagos',
    address: '19 Saka Tinubu Street, Victoria Island',
    phone: '+234 816 890 1234',
    email: 'studio@designpro.ng',
    website: 'https://designpro.ng',
    coordinates: { lat: 6.4281, lng: 3.4219 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'basic' as const,
    services: [
      { title: 'Complete Brand Identity Package', description: 'Logo design, color palette, typography, brand guidelines, business cards, letterhead.', pricing_model: 'fixed' as const, price: 350000, duration_text: '3-4 weeks' },
      { title: 'Logo Design', description: '3 concepts, unlimited revisions, final files in all formats (AI, PNG, SVG, PDF).', pricing_model: 'fixed' as const, price: 85000, duration_text: '1-2 weeks' },
      { title: 'Social Media Graphics Package', description: '30 custom posts for Instagram, Facebook, Twitter. Brand-consistent designs.', pricing_model: 'fixed' as const, price: 120000, duration_text: '1 week' },
      { title: 'Print Design (Flyers, Brochures)', description: 'Custom print materials, professional layouts, print-ready files.', pricing_model: 'fixed' as const, price: 45000, duration_text: '3-5 days' },
      { title: 'Packaging Design', description: 'Product packaging design, 3D mockups, print specifications.', pricing_model: 'fixed' as const, price: 180000, duration_text: '2-3 weeks' },
    ]
  },
  {
    business_name: 'The Content Factory',
    description: 'Expert content writing and SEO services for businesses and blogs. We create engaging content that ranks well and converts readers to customers.',
    business_type: 'service' as const,
    categoryName: 'Professional Services',
    subcategoryName: 'Copywriting',
    city: 'Abuja',
    state: 'FCT',
    address: '12 Durban Street, Wuse 2',
    phone: '+234 817 901 2345',
    email: 'team@contentfactory.ng',
    website: 'https://contentfactory.ng',
    coordinates: { lat: 9.0643, lng: 7.4892 },
    price_range: '$$' as const,
    is_premium: false,
    services: [
      { title: 'SEO Blog Post Writing', description: 'Keyword-optimized blog posts (1000-1500 words), engaging, well-researched content.', pricing_model: 'fixed' as const, price: 25000, duration_text: '3-5 days' },
      { title: 'Website Content Package', description: 'Complete website copy: homepage, about, services, contact. SEO-optimized.', pricing_model: 'fixed' as const, price: 180000, duration_text: '1-2 weeks' },
      { title: 'Product Descriptions (10 products)', description: 'Compelling product descriptions that sell, SEO-friendly, brand voice.', pricing_model: 'fixed' as const, price: 35000, duration_text: '2-3 days' },
      { title: 'Email Marketing Campaign', description: 'Series of 5 emails, subject lines, engaging copy, CTA optimization.', pricing_model: 'fixed' as const, price: 95000, duration_text: '1 week' },
      { title: 'Social Media Content Calendar', description: '30 days of captions, hashtags, posting schedule for all platforms.', pricing_model: 'fixed' as const, price: 75000, duration_text: '5-7 days' },
    ]
  },
  {
    business_name: 'TutorHub Nigeria',
    description: 'Private tutoring services for primary, secondary, and university students. Expert tutors in all subjects with proven track record of improving grades.',
    business_type: 'service' as const,
    categoryName: 'Education & Training',
    subcategoryName: 'Tutoring',
    city: 'Lagos',
    state: 'Lagos',
    address: '56 Ogudu Road, Ojota',
    phone: '+234 818 012 3456',
    email: 'info@tutorhub.ng',
    website: 'https://tutorhub.ng',
    coordinates: { lat: 6.5867, lng: 3.3667 },
    price_range: '$' as const,
    is_premium: false,
    services: [
      { title: 'WAEC/NECO Preparation (Per Subject)', description: 'Intensive exam preparation, past questions, exam techniques. 12 sessions.', pricing_model: 'fixed' as const, price: 48000, duration_text: '3 months' },
      { title: 'JAMB UTME Coaching', description: 'Comprehensive JAMB preparation covering all subjects, CBT practice.', pricing_model: 'fixed' as const, price: 65000, duration_text: '2 months' },
      { title: 'One-on-One Math Tutoring', description: 'Personalized math tutoring for any level, homework help, concept mastery.', pricing_model: 'hourly' as const, price: 5000, duration_text: 'Per hour' },
      { title: 'English Language Tutoring', description: 'Grammar, writing, comprehension, oral English. All levels.', pricing_model: 'hourly' as const, price: 5000, duration_text: 'Per hour' },
      { title: 'University Level Tutoring', description: 'Specialized tutoring for university courses: engineering, sciences, business.', pricing_model: 'hourly' as const, price: 8000, duration_text: 'Per hour' },
    ]
  },
  
  // Services Niche (3 businesses)
  {
    business_name: 'SparkleClean Pro',
    description: 'Professional home and office cleaning services. We use eco-friendly products and trained staff to deliver spotless results every time.',
    business_type: 'service' as const,
    categoryName: 'Home & Construction',
    subcategoryName: 'Cleaning Services',
    city: 'Lagos',
    state: 'Lagos',
    address: '23 Ago Palace Way, Okota',
    phone: '+234 819 123 4567',
    email: 'bookings@sparkleclean.ng',
    website: 'https://sparkleclean.ng',
    coordinates: { lat: 6.4698, lng: 3.2852 },
    price_range: '$' as const,
    is_premium: false,
    services: [
      { title: 'Standard Home Cleaning', description: 'Complete home cleaning: dusting, mopping, bathroom, kitchen. 2-3 bedroom apartment.', pricing_model: 'fixed' as const, price: 18000, duration_text: '3-4 hours' },
      { title: 'Deep Cleaning Service', description: 'Intensive cleaning including windows, appliances, baseboards, detailed bathroom cleaning.', pricing_model: 'fixed' as const, price: 35000, duration_text: 'Full day' },
      { title: 'Office Cleaning (Per Visit)', description: 'Office spaces up to 200 sqm: floors, desks, bathrooms, windows, trash removal.', pricing_model: 'fixed' as const, price: 25000, duration_text: '2-3 hours' },
      { title: 'Post-Construction Cleaning', description: 'Remove dust, debris, paint marks. Make newly built/renovated space move-in ready.', pricing_model: 'fixed' as const, price: 65000, duration_text: 'Full day' },
    ]
  },
  {
    business_name: 'EventMasters Nigeria',
    description: 'Full-service event planning and management for weddings, corporate events, and parties. We handle everything from concept to execution.',
    business_type: 'service' as const,
    categoryName: 'Professional Services',
    subcategoryName: 'Event Planning',
    city: 'Abuja',
    state: 'FCT',
    address: '45 Aminu Kano Crescent, Wuse 2',
    phone: '+234 820 234 5678',
    email: 'events@eventmasters.ng',
    website: 'https://eventmasters.ng',
    coordinates: { lat: 9.0765, lng: 7.4861 },
    price_range: '$$$' as const,
    is_premium: true,
    premium_tier: 'pro' as const,
    services: [
      { title: 'Wedding Planning (Full Service)', description: 'Complete wedding planning: venue, vendors, decor, coordination, timeline management. For 200-300 guests.', pricing_model: 'fixed' as const, price: 1500000, duration_text: '3-6 months planning' },
      { title: 'Corporate Event Management', description: 'Product launches, conferences, seminars. Full logistics, AV, catering coordination.', pricing_model: 'fixed' as const, price: 850000, duration_text: '1-3 months planning' },
      { title: 'Birthday Party Planning', description: 'Kids or adult parties: theme development, decor, entertainment, catering. Up to 100 guests.', pricing_model: 'fixed' as const, price: 380000, duration_text: '1 month planning' },
      { title: 'Event Day Coordination', description: 'Professional coordinator for your event day, timeline management, vendor coordination.', pricing_model: 'fixed' as const, price: 150000, duration_text: 'Event day' },
    ]
  },
  {
    business_name: 'SnapShot Photography',
    description: 'Professional photography and videography for weddings, events, and portraits. High-quality images, fast delivery, affordable packages.',
    business_type: 'service' as const,
    categoryName: 'Professional Services',
    subcategoryName: 'Photography',
    city: 'Lagos',
    state: 'Lagos',
    address: '78 Bode Thomas Street, Surulere',
    phone: '+234 821 345 6789',
    email: 'bookings@snapshot.ng',
    website: 'https://snapshot.ng',
    coordinates: { lat: 6.4969, lng: 3.3553 },
    price_range: '$$' as const,
    is_premium: true,
    premium_tier: 'basic' as const,
    services: [
      { title: 'Wedding Photography Package', description: 'Full-day coverage, 2 photographers, 500+ edited photos, online gallery, USB drive.', pricing_model: 'fixed' as const, price: 450000, duration_text: 'Full wedding day' },
      { title: 'Event Photography (4 hours)', description: 'Corporate events, parties, birthdays. 200+ edited photos, online sharing.', pricing_model: 'fixed' as const, price: 120000, duration_text: '4 hours' },
      { title: 'Portrait Photography Session', description: 'Studio or outdoor portraits, 1 hour session, 30 edited photos, prints available.', pricing_model: 'fixed' as const, price: 45000, duration_text: '1 hour' },
      { title: 'Product Photography (20 products)', description: 'Professional product photos for e-commerce, white background, all angles.', pricing_model: 'fixed' as const, price: 65000, duration_text: '2-3 hours' },
      { title: 'Videography (Highlight Video)', description: '3-5 minute cinematic highlight video of your event with music and editing.', pricing_model: 'fixed' as const, price: 180000, duration_text: '2 weeks delivery' },
    ]
  },
];

interface CategoryMap {
  [key: string]: string;
}

interface SubcategoryMap {
  [key: string]: { [key: string]: string };
}

/**
 * Get categories and subcategories from database
 */
async function getCategories(): Promise<{ categories: CategoryMap; subcategories: SubcategoryMap }> {
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('id, name, parent_id');

  if (catError) {
    throw new Error(`Failed to fetch categories: ${catError.message}`);
  }

  const categories: CategoryMap = {};
  const subcategories: SubcategoryMap = {};

  if (categoriesData) {
    categoriesData.forEach((cat) => {
      if (!cat.parent_id) {
        // Main category
        categories[cat.name] = cat.id;
      } else {
        // Subcategory - find parent name
        const parent = categoriesData.find(p => p.id === cat.parent_id);
        if (parent) {
          if (!subcategories[parent.name]) {
            subcategories[parent.name] = {};
          }
          subcategories[parent.name][cat.name] = cat.id;
        }
      }
    });
  }

  return { categories, subcategories };
}

/**
 * Create or get sample user for a specific business
 */
async function ensureSampleUser(businessName: string): Promise<string> {
  const emailSafeName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `${emailSafeName}@findam4area.sample.ng`;
  
  // Try to get existing user by email via auth admin
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (!listError && existingUsers) {
    const existingUser = existingUsers.users.find(u => u.email === email);
    if (existingUser) {
      return existingUser.id;
    }
  }

  // Create a new user for this business
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'SamplePass123!',
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create sample user for ${businessName}: ${authError?.message}`);
  }

  return authData.user.id;
}

/**
 * Check if business already exists
 */
async function businessExists(businessName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_name', businessName)
    .limit(1);

  if (error) {
    console.error(`Error checking business: ${error.message}`);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Insert a business profile
 */
async function insertBusinessProfile(
  userId: string,
  business: any,
  primaryCategoryId: string,
  subcategoryId: string | null
): Promise<string | null> {
  const createdAt = getRandomDateInLast6Months();
  const averageRating = getRandomRating();
  const reviewCount = getRandomReviewCount();

  const businessData = {
    user_id: userId,
    business_name: business.business_name,
    display_name: business.business_name,
    description: business.description,
    business_type: business.business_type,
    primary_category_id: primaryCategoryId,
    primary_subcategory_ids: subcategoryId ? [subcategoryId] : [],
    address: business.address,
    city: business.city,
    state: business.state,
    phone: business.phone,
    email: business.email,
    website: business.website,
    coordinates: `POINT(${business.coordinates.lng} ${business.coordinates.lat})`,
    price_range: business.price_range,
    is_premium: business.is_premium,
    premium_tier: business.premium_tier || null,
    premium_expires_at: business.is_premium 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
      : null,
    is_verified: true,
    verified_at: createdAt.toISOString(),
    is_active: true,
    average_rating: averageRating,
    review_count: reviewCount,
    completeness_percentage: 95,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
  };

  const { data, error } = await supabase
    .from('business_profiles')
    .insert(businessData)
    .select('id')
    .single();

  if (error) {
    console.error(`   ❌ Error inserting business: ${error.message}`);
    return null;
  }

  return data.id;
}

/**
 * Insert products for a business
 */
async function insertProducts(businessId: string, products: any[]): Promise<number> {
  let inserted = 0;
  
  for (const product of products) {
    const productData = {
      business_profile_id: businessId,
      title: product.title,
      description: product.description,
      product_type: product.product_type,
      price: product.price,
      currency: 'NGN',
      stock_quantity: product.stock_quantity,
      low_stock_threshold: 5,
      image_urls: ['https://via.placeholder.com/800x600?text=' + encodeURIComponent(product.title)],
      primary_image_url: 'https://via.placeholder.com/800x600?text=' + encodeURIComponent(product.title),
      is_active: true,
      is_featured: Math.random() > 0.7,
    };

    const { error } = await supabase
      .from('product_listings')
      .insert(productData);

    if (error) {
      console.error(`   ❌ Error inserting product "${product.title}": ${error.message}`);
    } else {
      inserted++;
    }
  }

  return inserted;
}

/**
 * Insert services for a business
 */
async function insertServices(businessId: string, services: any[]): Promise<number> {
  let inserted = 0;
  
  for (const service of services) {
    const serviceData = {
      business_profile_id: businessId,
      title: service.title,
      description: service.description,
      pricing_model: service.pricing_model,
      price: service.price > 0 ? service.price : null,
      currency: 'NGN',
      duration_text: service.duration_text,
      image_urls: ['https://via.placeholder.com/800x600?text=' + encodeURIComponent(service.title)],
      primary_image_url: 'https://via.placeholder.com/800x600?text=' + encodeURIComponent(service.title),
      is_active: true,
      is_featured: Math.random() > 0.7,
    };

    const { error } = await supabase
      .from('service_listings')
      .insert(serviceData);

    if (error) {
      console.error(`   ❌ Error inserting service "${service.title}": ${error.message}`);
    } else {
      inserted++;
    }
  }

  return inserted;
}

/**
 * Main seeding function
 */
async function seedSampleBusinesses() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       FINDAM4AREA - SAMPLE BUSINESSES SEEDING SCRIPT       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Get categories
    console.log('📋 Loading categories...');
    const { categories, subcategories } = await getCategories();
    console.log(`   ✅ Loaded ${Object.keys(categories).length} main categories\n`);

    let businessesInserted = 0;
    let businessesSkipped = 0;
    let productsInserted = 0;
    let servicesInserted = 0;
    let usersCreated = 0;

    // Seed each business
    console.log('🏪 Seeding businesses...\n');

    for (const business of sampleBusinesses) {
      console.log(`📦 Processing: ${business.business_name}`);

      // Check if already exists
      if (await businessExists(business.business_name)) {
        console.log(`   ⏭️  Already exists, skipping...\n`);
        businessesSkipped++;
        continue;
      }

      // Get or create user for this business
      try {
        const userId = await ensureSampleUser(business.business_name);
        console.log(`   ✅ User ready (ID: ${userId.substring(0, 8)}...)`);
        usersCreated++;
      } catch (error: any) {
        console.error(`   ❌ Failed to create user: ${error.message}\n`);
        continue;
      }

      // Get category IDs
      const primaryCategoryId = categories[business.categoryName];
      const subcategoryId = subcategories[business.categoryName]?.[business.subcategoryName] || null;

      if (!primaryCategoryId) {
        console.error(`   ❌ Category "${business.categoryName}" not found\n`);
        continue;
      }

      // Get user ID again (for clarity)
      const userId = await ensureSampleUser(business.business_name);

      // Insert business profile
      const businessId = await insertBusinessProfile(userId, business, primaryCategoryId, subcategoryId);

      if (!businessId) {
        console.log(`   ❌ Failed to insert business\n`);
        continue;
      }

      console.log(`   ✅ Business inserted (ID: ${businessId.substring(0, 8)}...)`);
      businessesInserted++;

      // Insert products if any
      if (business.products && business.products.length > 0) {
        const productCount = await insertProducts(businessId, business.products);
        console.log(`   ✅ ${productCount}/${business.products.length} products inserted`);
        productsInserted += productCount;
      }

      // Insert services if any
      if (business.services && business.services.length > 0) {
        const serviceCount = await insertServices(businessId, business.services);
        console.log(`   ✅ ${serviceCount}/${business.services.length} services inserted`);
        servicesInserted += serviceCount;
      }

      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SEEDING SUMMARY\n');
    console.log(`👥 Users created: ${usersCreated}`);
    console.log(`✅ Businesses inserted: ${businessesInserted}`);
    console.log(`⏭️  Businesses skipped: ${businessesSkipped}`);
    console.log(`📦 Products inserted: ${productsInserted}`);
    console.log(`🛠️  Services inserted: ${servicesInserted}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (businessesInserted > 0) {
      console.log('✅ Sample businesses seeded successfully!\n');
      console.log('💡 Next steps:');
      console.log('   1. Browse businesses on the marketplace');
      console.log('   2. Test search and filtering');
      console.log('   3. Verify business profiles display correctly');
      console.log('   4. Test product/service listings\n');
      return true;
    } else {
      console.log('⚠️  No new businesses were inserted\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return false;
  }
}

// Run seeding
seedSampleBusinesses()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
