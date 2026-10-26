import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const businessData: Record<string, { products?: any[], services?: any[] }> = {
  'TechHub Nigeria': {
    products: [
      { title: 'MacBook Pro M3 16-inch', description: 'Latest Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Brand new with international warranty.', price: 2850000, stock_quantity: 5 },
      { title: 'iPhone 15 Pro Max', description: '256GB, all colors available. Genuine Apple warranty, accessories included.', price: 1450000, stock_quantity: 12 },
      { title: 'Samsung Galaxy S24 Ultra', description: '512GB storage, S-Pen included. Premium flagship with 2-year warranty.', price: 1250000, stock_quantity: 8 },
      { title: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation, 30-hour battery life, premium comfort.', price: 285000, stock_quantity: 15 },
    ]
  },
  'GadgetZone Abuja': {
    products: [
      { title: 'PlayStation 5 Slim Console', description: 'PS5 with 2 controllers, FIFA 24, and 1TB storage. Ready to play bundle.', price: 865000, stock_quantity: 4 },
      { title: 'Ring Video Doorbell Pro', description: 'Smart doorbell with HD video, motion detection, two-way audio.', price: 145000, stock_quantity: 20 },
      { title: 'Amazon Echo Dot (5th Gen)', description: 'Smart speaker with Alexa, improved sound quality, voice control for smart home.', price: 48000, stock_quantity: 35 },
      { title: 'Logitech G Pro Wireless Mouse', description: 'Professional gaming mouse, ultra-lightweight, 25K DPI sensor.', price: 95000, stock_quantity: 18 },
    ]
  },
  'CodeCraft Academy': {
    services: [
      { title: 'Full-Stack Web Development Bootcamp', description: '16-week intensive program covering HTML, CSS, JavaScript, React, Node.js, databases. Job placement assistance included.', pricing_model: 'fixed', price: 450000, duration_text: '16 weeks' },
      { title: 'Mobile App Development with React Native', description: 'Build iOS and Android apps with React Native. 12-week course with hands-on projects.', pricing_model: 'fixed', price: 380000, duration_text: '12 weeks' },
      { title: 'Cloud Computing (AWS/Azure) Certification', description: 'Prepare for AWS or Azure certification. Expert instructors, practice exams, real-world projects.', pricing_model: 'fixed', price: 320000, duration_text: '8 weeks' },
      { title: 'IT Consulting for Businesses', description: 'Technology strategy, system architecture, digital transformation consulting.', pricing_model: 'hourly', price: 35000, duration_text: 'Per hour' },
    ]
  },
  'AutoParts Express': {
    products: [
      { title: 'Bosch Car Battery 75Ah', description: 'Premium maintenance-free battery, 3-year warranty, fits most sedans.', price: 85000, stock_quantity: 25 },
      { title: 'Michelin Pilot Sport Tires (Set of 4)', description: '225/45R17 premium performance tires, excellent grip and durability.', price: 320000, stock_quantity: 12 },
      { title: 'Denso Brake Pads (Toyota/Lexus)', description: 'OEM-quality ceramic brake pads, low dust, quiet operation.', price: 45000, stock_quantity: 40 },
      { title: 'Mobil 1 Synthetic Oil (5 Liters)', description: 'Full synthetic motor oil 5W-30, advanced engine protection.', price: 28000, stock_quantity: 60 },
    ]
  },
  'Elite Auto Detailing': {
    services: [
      { title: 'Premium Exterior Detailing', description: 'Hand wash, clay bar treatment, polish, wax, tire dressing, glass cleaning. Show-quality finish.', pricing_model: 'fixed', price: 45000, duration_text: '3-4 hours' },
      { title: 'Interior Deep Cleaning', description: 'Vacuum, steam clean, leather conditioning, odor removal, dashboard polish.', pricing_model: 'fixed', price: 35000, duration_text: '2-3 hours' },
      { title: 'Complete Detailing Package', description: 'Full exterior and interior detailing, engine bay cleaning, headlight restoration.', pricing_model: 'fixed', price: 75000, duration_text: '5-6 hours' },
      { title: 'Ceramic Coating Application', description: 'Professional-grade ceramic coating for long-lasting protection and shine. Lasts 2-3 years.', pricing_model: 'fixed', price: 185000, duration_text: 'Full day' },
    ]
  },
  'MechaniPro Garage': {
    services: [
      { title: 'Comprehensive Vehicle Inspection', description: 'Full 50-point inspection with diagnostic scan, written report, and recommendations.', pricing_model: 'fixed', price: 15000, duration_text: '1-2 hours' },
      { title: 'Engine Diagnostics & Repair', description: 'Computer diagnostics, engine troubleshooting, repairs by certified mechanics.', pricing_model: 'custom', price: 0, duration_text: 'Varies by issue' },
      { title: 'Brake System Service', description: 'Brake inspection, pad replacement, rotor resurfacing, fluid flush.', pricing_model: 'fixed', price: 65000, duration_text: '2-3 hours' },
      { title: 'AC System Service & Repair', description: 'AC diagnostic, refrigerant recharge, compressor repair, leak detection.', pricing_model: 'fixed', price: 45000, duration_text: '2-3 hours' },
    ]
  },
  'StyleHub Boutique': {
    products: [
      { title: "Men's Designer Kaftan Set", description: 'Premium senator kaftan with embroidery, matching cap. Perfect for special occasions.', price: 85000, stock_quantity: 15 },
      { title: "Women's Ankara Midi Dress", description: 'Vibrant African print dress, fitted bodice, flared skirt. Multiple sizes available.', price: 45000, stock_quantity: 30 },
      { title: "Men's Fitted Suit (3-Piece)", description: 'Slim-fit suit jacket, vest, trousers. Italian wool blend, custom alterations included.', price: 125000, stock_quantity: 8 },
      { title: "Women's Leather Handbag", description: 'Genuine leather tote bag, spacious interior, gold hardware. Designer quality.', price: 75000, stock_quantity: 12 },
    ]
  },
  'Gele & Lace Palace': {
    products: [
      { title: 'Premium Aso-Oke Fabric (5 yards)', description: 'Hand-woven aso-oke in royal blue with gold threading. Perfect for owambe.', price: 145000, stock_quantity: 8 },
      { title: 'French Lace (5 yards)', description: 'Imported French lace with stones and sequins, multiple colors available.', price: 95000, stock_quantity: 20 },
      { title: 'Ready-Made Gele (Auto-Gele)', description: 'Pre-tied gele, easy to wear, maintains shape all day. Various colors.', price: 25000, stock_quantity: 40 },
      { title: 'Ankara Print Fabric (6 yards)', description: 'Vibrant African wax print, colorfast, premium quality. Perfect for any style.', price: 18000, stock_quantity: 60 },
    ]
  },
  'FootWear Kingdom': {
    products: [
      { title: "Men's Italian Leather Oxfords", description: 'Genuine leather dress shoes, handcrafted in Italy, sizes 40-46 available.', price: 65000, stock_quantity: 18 },
      { title: "Women's Designer Heels", description: 'Elegant stiletto heels, 4-inch height, comfortable padding, party-ready.', price: 48000, stock_quantity: 25 },
      { title: "Men's Casual Sneakers", description: 'Turkish-made casual sneakers, breathable material, trendy design.', price: 35000, stock_quantity: 35 },
      { title: "Women's Leather Crossbody Bag", description: 'Compact leather bag with adjustable strap, perfect for everyday use.', price: 42000, stock_quantity: 20 },
    ]
  },
  'Mama Put Deluxe': {
    services: [
      { title: 'Jollof Rice & Grilled Chicken', description: 'Our signature party jollof rice with perfectly grilled chicken, coleslaw, and plantain.', pricing_model: 'fixed', price: 4500, duration_text: 'Dine-in or takeout' },
      { title: 'Egusi Soup with Pounded Yam', description: 'Rich egusi soup with assorted meat, served with fresh pounded yam.', pricing_model: 'fixed', price: 5200, duration_text: 'Dine-in or takeout' },
      { title: 'Pepper Soup Special', description: 'Spicy goat meat or catfish pepper soup with yam or plantain. Perfect comfort food.', pricing_model: 'fixed', price: 4800, duration_text: 'Dine-in or takeout' },
      { title: 'Ofada Rice & Ayamase Stew', description: 'Local Ofada rice with designer stew (ayamase), assorted meat, and boiled eggs.', pricing_model: 'fixed', price: 5500, duration_text: 'Dine-in or takeout' },
    ]
  },
  'Brew & Bites Café': {
    services: [
      { title: 'Avocado Toast & Latte', description: 'Artisan sourdough with smashed avocado, poached egg, cherry tomatoes. Served with our signature latte.', pricing_model: 'fixed', price: 4800, duration_text: 'Breakfast/Brunch' },
      { title: 'Classic Eggs Benedict', description: 'Poached eggs on English muffin with hollandaise, choice of bacon or smoked salmon.', pricing_model: 'fixed', price: 5500, duration_text: 'Breakfast/Brunch' },
      { title: 'Gourmet Burger & Coffee', description: 'Wagyu beef burger with fries and specialty coffee of your choice.', pricing_model: 'fixed', price: 6200, duration_text: 'Lunch/Dinner' },
    ],
    products: [
      { title: 'Brew & Bites Coffee Beans (250g)', description: 'Our signature medium roast, freshly roasted. Notes of chocolate and caramel.', price: 5500, stock_quantity: 50 },
      { title: 'House-Made Granola (500g)', description: 'Honey-roasted granola with nuts and dried fruits. Perfect for breakfast.', price: 3800, stock_quantity: 30 },
    ]
  },
  'Spice Route Kitchen': {
    services: [
      { title: 'Pad Thai with Prawns', description: 'Traditional Thai stir-fried noodles with succulent prawns, peanuts, bean sprouts.', pricing_model: 'fixed', price: 7500, duration_text: 'Lunch/Dinner' },
      { title: 'Sushi Platter (24 pieces)', description: 'Assorted nigiri and maki rolls with fresh fish, wasabi, soy sauce, pickled ginger.', pricing_model: 'fixed', price: 12500, duration_text: 'Lunch/Dinner' },
      { title: 'Kung Pao Chicken', description: 'Spicy Sichuan-style chicken with peanuts, vegetables, steamed rice.', pricing_model: 'fixed', price: 6800, duration_text: 'Lunch/Dinner' },
      { title: 'Beef Ramen Bowl', description: 'Rich tonkotsu broth, tender beef, soft-boiled egg, bamboo shoots, scallions.', pricing_model: 'fixed', price: 8200, duration_text: 'Lunch/Dinner' },
    ]
  },
  'DesignPro Studio': {
    services: [
      { title: 'Complete Brand Identity Package', description: 'Logo design, color palette, typography, brand guidelines, business cards, letterhead.', pricing_model: 'fixed', price: 350000, duration_text: '3-4 weeks' },
      { title: 'Logo Design', description: '3 concepts, unlimited revisions, final files in all formats (AI, PNG, SVG, PDF).', pricing_model: 'fixed', price: 85000, duration_text: '1-2 weeks' },
      { title: 'Social Media Graphics Package', description: '30 custom posts for Instagram, Facebook, Twitter. Brand-consistent designs.', pricing_model: 'fixed', price: 120000, duration_text: '1 week' },
      { title: 'Print Design (Flyers, Brochures)', description: 'Custom print materials, professional layouts, print-ready files.', pricing_model: 'fixed', price: 45000, duration_text: '3-5 days' },
    ]
  },
  'The Content Factory': {
    services: [
      { title: 'SEO Blog Post Writing', description: 'Keyword-optimized blog posts (1000-1500 words), engaging, well-researched content.', pricing_model: 'fixed', price: 25000, duration_text: '3-5 days' },
      { title: 'Website Content Package', description: 'Complete website copy: homepage, about, services, contact. SEO-optimized.', pricing_model: 'fixed', price: 180000, duration_text: '1-2 weeks' },
      { title: 'Product Descriptions (10 products)', description: 'Compelling product descriptions that sell, SEO-friendly, brand voice.', pricing_model: 'fixed', price: 35000, duration_text: '2-3 days' },
      { title: 'Email Marketing Campaign', description: 'Series of 5 emails, subject lines, engaging copy, CTA optimization.', pricing_model: 'fixed', price: 95000, duration_text: '1 week' },
    ]
  },
  'TutorHub Nigeria': {
    services: [
      { title: 'WAEC/NECO Preparation (Per Subject)', description: 'Intensive exam preparation, past questions, exam techniques. 12 sessions.', pricing_model: 'fixed', price: 48000, duration_text: '3 months' },
      { title: 'JAMB UTME Coaching', description: 'Comprehensive JAMB preparation covering all subjects, CBT practice.', pricing_model: 'fixed', price: 65000, duration_text: '2 months' },
      { title: 'One-on-One Math Tutoring', description: 'Personalized math tutoring for any level, homework help, concept mastery.', pricing_model: 'hourly', price: 5000, duration_text: 'Per hour' },
      { title: 'English Language Tutoring', description: 'Grammar, writing, comprehension, oral English. All levels.', pricing_model: 'hourly', price: 5000, duration_text: 'Per hour' },
    ]
  },
  'SparkleClean Pro': {
    services: [
      { title: 'Standard Home Cleaning', description: 'Complete home cleaning: dusting, mopping, bathroom, kitchen. 2-3 bedroom apartment.', pricing_model: 'fixed', price: 18000, duration_text: '3-4 hours' },
      { title: 'Deep Cleaning Service', description: 'Intensive cleaning including windows, appliances, baseboards, detailed bathroom cleaning.', pricing_model: 'fixed', price: 35000, duration_text: 'Full day' },
      { title: 'Office Cleaning (Per Visit)', description: 'Office spaces up to 200 sqm: floors, desks, bathrooms, windows, trash removal.', pricing_model: 'fixed', price: 25000, duration_text: '2-3 hours' },
      { title: 'Post-Construction Cleaning', description: 'Remove dust, debris, paint marks. Make newly built/renovated space move-in ready.', pricing_model: 'fixed', price: 65000, duration_text: 'Full day' },
    ]
  },
  'EventMasters Nigeria': {
    services: [
      { title: 'Wedding Planning (Full Service)', description: 'Complete wedding planning: venue, vendors, decor, coordination, timeline management. For 200-300 guests.', pricing_model: 'fixed', price: 1500000, duration_text: '3-6 months planning' },
      { title: 'Corporate Event Management', description: 'Product launches, conferences, seminars. Full logistics, AV, catering coordination.', pricing_model: 'fixed', price: 850000, duration_text: '1-3 months planning' },
      { title: 'Birthday Party Planning', description: 'Kids or adult parties: theme development, decor, entertainment, catering. Up to 100 guests.', pricing_model: 'fixed', price: 380000, duration_text: '1 month planning' },
      { title: 'Event Day Coordination', description: 'Professional coordinator for your event day, timeline management, vendor coordination.', pricing_model: 'fixed', price: 150000, duration_text: 'Event day' },
    ]
  },
  'SnapShot Photography': {
    services: [
      { title: 'Wedding Photography Package', description: 'Full-day coverage, 2 photographers, 500+ edited photos, online gallery, USB drive.', pricing_model: 'fixed', price: 450000, duration_text: 'Full wedding day' },
      { title: 'Event Photography (4 hours)', description: 'Corporate events, parties, birthdays. 200+ edited photos, online sharing.', pricing_model: 'fixed', price: 120000, duration_text: '4 hours' },
      { title: 'Portrait Photography Session', description: 'Studio or outdoor portraits, 1 hour session, 30 edited photos, prints available.', pricing_model: 'fixed', price: 45000, duration_text: '1 hour' },
      { title: 'Product Photography (20 products)', description: 'Professional product photos for e-commerce, white background, all angles.', pricing_model: 'fixed', price: 65000, duration_text: '2-3 hours' },
    ]
  },
};

async function addAll() {
  console.log('🔄 Adding products and services...\n');
  let totalProducts = 0;
  let totalServices = 0;

  const { data: businesses } = await supabase
    .from('business_profiles')
    .select('id, business_name, business_type');

  if (!businesses) {
    console.log('No businesses found');
    return;
  }

  for (const business of businesses) {
    const data = businessData[business.business_name];
    if (!data) continue;

    console.log(`📦 ${business.business_name}`);

    // Add products
    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        const { error } = await supabase.from('product_listings').insert({
          business_profile_id: business.id,
          title: product.title,
          description: product.description,
          product_type: 'physical',
          price: product.price,
          currency: 'NGN',
          stock_quantity: product.stock_quantity,
          low_stock_threshold: 5,
          image_urls: [],
          is_active: true,
          is_featured: false,
        });
        if (!error) totalProducts++;
        else console.log('   ❌ Product error:', error.message);
      }
      console.log(`   ✅ ${data.products.length} products added`);
    }

    // Add services
    if (data.services && data.services.length > 0) {
      for (const service of data.services) {
        const { error } = await supabase.from('service_listings').insert({
          business_profile_id: business.id,
          title: service.title,
          description: service.description,
          pricing_model: service.pricing_model,
          price: service.price > 0 ? service.price : null,
          currency: 'NGN',
          duration_text: service.duration_text,
          image_urls: [],
          is_active: true,
          is_featured: false,
        });
        if (!error) totalServices++;
        else console.log('   ❌ Service error:', error.message);
      }
      console.log(`   ✅ ${data.services.length} services added`);
    }
  }

  console.log(`\n✅ Total: ${totalProducts} products, ${totalServices} services added!`);
}

addAll();
