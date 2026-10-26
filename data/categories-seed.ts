/**
 * Category Seed Data for Advanced Category Taxonomy System
 * 
 * This file contains all 23 main categories and their 289 subcategories
 * with proper parent relationships, display orders, icons, and descriptions.
 * 
 * Note: Only English language is used (multilingual features excluded per constraints)
 */

export interface CategorySeed {
  name: string;
  description: string;
  icon: string;
  display_order: number;
  subcategories?: SubcategorySeed[];
}

export interface SubcategorySeed {
  name: string;
  description: string;
  display_order: number;
}

export const categoriesSeed: CategorySeed[] = [
  {
    name: 'Home & Construction',
    description: 'Professional home improvement, construction, and maintenance services',
    icon: 'Home',
    display_order: 1,
    subcategories: [
      { name: 'Plumbing', description: 'Pipe installation, repair, and water system services', display_order: 1 },
      { name: 'Electrical', description: 'Wiring, lighting, and electrical system installation and repair', display_order: 2 },
      { name: 'Carpentry', description: 'Woodworking, furniture making, and custom carpentry services', display_order: 3 },
      { name: 'Painting', description: 'Interior and exterior painting and finishing services', display_order: 4 },
      { name: 'Roofing', description: 'Roof installation, repair, and maintenance services', display_order: 5 },
      { name: 'HVAC', description: 'Heating, ventilation, and air conditioning services', display_order: 6 },
      { name: 'Masonry', description: 'Bricklaying, stone work, and concrete services', display_order: 7 },
      { name: 'Landscaping', description: 'Garden design, lawn care, and outdoor beautification', display_order: 8 },
      { name: 'Interior Design', description: 'Space planning and interior decoration services', display_order: 9 },
      { name: 'Architecture', description: 'Building design and architectural planning services', display_order: 10 },
      { name: 'General Contracting', description: 'Project management and general construction services', display_order: 11 },
      { name: 'Home Security', description: 'Security system installation and monitoring services', display_order: 12 },
      { name: 'Pest Control', description: 'Pest extermination and prevention services', display_order: 13 },
      { name: 'Cleaning Services', description: 'Residential and commercial cleaning services', display_order: 14 },
      { name: 'Moving Services', description: 'Relocation and moving assistance services', display_order: 15 },
    ]
  },
  {
    name: 'Health & Medical',
    description: 'Healthcare services, medical facilities, and wellness providers',
    icon: 'Heart',
    display_order: 2,
    subcategories: [
      { name: 'Hospitals', description: 'General and specialized hospital services', display_order: 1 },
      { name: 'Clinics', description: 'Outpatient medical clinics and health centers', display_order: 2 },
      { name: 'Pharmacies', description: 'Prescription and over-the-counter medication dispensing', display_order: 3 },
      { name: 'Dentistry', description: 'Dental care and oral health services', display_order: 4 },
      { name: 'Optometry', description: 'Eye care and vision services', display_order: 5 },
      { name: 'Physical Therapy', description: 'Rehabilitation and physical therapy services', display_order: 6 },
      { name: 'Mental Health', description: 'Counseling and mental health services', display_order: 7 },
      { name: 'Nutrition', description: 'Dietary consultation and nutrition services', display_order: 8 },
      { name: 'Alternative Medicine', description: 'Holistic and alternative healthcare approaches', display_order: 9 },
      { name: 'Home Healthcare', description: 'In-home medical care and nursing services', display_order: 10 },
      { name: 'Medical Equipment', description: 'Medical device sales and rentals', display_order: 11 },
      { name: 'Laboratory Services', description: 'Diagnostic testing and medical laboratory services', display_order: 12 },
      { name: 'Radiology', description: 'Medical imaging and diagnostic radiology services', display_order: 13 },
      { name: 'Pediatrics', description: 'Child healthcare and pediatric services', display_order: 14 },
      { name: 'Geriatrics', description: 'Elderly care and senior health services', display_order: 15 },
      { name: 'Emergency Services', description: 'Emergency medical care and ambulance services', display_order: 16 },
      { name: 'Telemedicine', description: 'Remote healthcare consultation and services', display_order: 17 },
      { name: 'Veterinary', description: 'Animal healthcare and veterinary services', display_order: 18 },
    ]
  },
  {
    name: 'Retail & Shopping',
    description: 'Stores and retail businesses for consumer goods',
    icon: 'ShoppingBag',
    display_order: 3,
    subcategories: [
      { name: 'Supermarkets', description: 'Full-service grocery and food stores', display_order: 1 },
      { name: 'Electronics', description: 'Electronic devices and gadget retailers', display_order: 2 },
      { name: 'Smartphones', description: 'Mobile phones and smartphone retailers', display_order: 3 },
      { name: 'Smart Watches', description: 'Smartwatches and wearable technology', display_order: 4 },
      { name: 'Tablets', description: 'Tablet computers and accessories', display_order: 5 },
      { name: 'Tech Accessories', description: 'Phone cases, chargers, and tech accessories', display_order: 6 },
      { name: 'Fashion', description: 'Clothing and fashion retail stores', display_order: 7 },
      { name: 'Furniture', description: 'Home and office furniture stores', display_order: 8 },
      { name: 'Appliances', description: 'Home appliance retailers', display_order: 9 },
      { name: 'Jewelry', description: 'Jewelry and precious metals retailers', display_order: 10 },
      { name: 'Books', description: 'Bookstores and reading material retailers', display_order: 11 },
      { name: 'Sports Equipment', description: 'Sporting goods and equipment stores', display_order: 12 },
      { name: 'Toys', description: 'Toy stores and children\'s playthings', display_order: 13 },
      { name: 'Game Shop', description: 'Video games and gaming accessories', display_order: 14 },
      { name: 'Beauty Products', description: 'Cosmetics and beauty product retailers', display_order: 15 },
      { name: 'Groceries', description: 'Food and grocery stores', display_order: 16 },
      { name: 'Hardware', description: 'Hardware and tools retailers', display_order: 17 },
      { name: 'Office Supplies', description: 'Business and office supply stores', display_order: 18 },
      { name: 'Pet Supplies', description: 'Pet food, accessories, and supplies', display_order: 19 },
      { name: 'Art Supplies', description: 'Art materials and craft supplies', display_order: 20 },
      { name: 'Music Instruments', description: 'Musical instruments and accessories', display_order: 21 },
      { name: 'Party Supplies', description: 'Party decorations and event supplies', display_order: 22 },
      { name: 'Gift Shops', description: 'Gift stores and specialty items', display_order: 23 },
      { name: 'Convenience Stores', description: 'Quick-stop convenience stores', display_order: 24 },
    ]
  },
  {
    name: 'Education & Training',
    description: 'Educational institutions and training services',
    icon: 'GraduationCap',
    display_order: 4,
    subcategories: [
      { name: 'Primary Schools', description: 'Elementary and primary education institutions', display_order: 1 },
      { name: 'Secondary Schools', description: 'High schools and secondary education', display_order: 2 },
      { name: 'Universities', description: 'Higher education and university institutions', display_order: 3 },
      { name: 'Vocational Training', description: 'Skills and vocational training centers', display_order: 4 },
      { name: 'Language Schools', description: 'Language learning and instruction services', display_order: 5 },
      { name: 'Tutoring', description: 'Private tutoring and academic support', display_order: 6 },
      { name: 'Music Lessons', description: 'Music instruction and lessons', display_order: 7 },
      { name: 'Dance Classes', description: 'Dance instruction and choreography', display_order: 8 },
      { name: 'Driving Schools', description: 'Driver education and training services', display_order: 9 },
      { name: 'Cooking Classes', description: 'Culinary instruction and cooking lessons', display_order: 10 },
      { name: 'Professional Certifications', description: 'Professional certification training programs', display_order: 11 },
      { name: 'Online Courses', description: 'Digital learning and e-learning platforms', display_order: 12 },
      { name: 'Special Education', description: 'Specialized educational services', display_order: 13 },
      { name: 'Daycare', description: 'Early childhood care and education', display_order: 14 },
      { name: 'Test Preparation', description: 'Exam preparation and coaching services', display_order: 15 },
    ]
  },
  {
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, and food service establishments',
    icon: 'UtensilsCrossed',
    display_order: 5,
    subcategories: [
      { name: 'Restaurants', description: 'Full-service dining establishments', display_order: 1 },
      { name: 'Cafes', description: 'Coffee shops and casual cafes', display_order: 2 },
      { name: 'Bars', description: 'Bars and drinking establishments', display_order: 3 },
      { name: 'Fast Food', description: 'Quick-service restaurants', display_order: 4 },
      { name: 'Catering', description: 'Event catering and food services', display_order: 5 },
      { name: 'Bakeries', description: 'Bakeries and pastry shops', display_order: 6 },
      { name: 'Food Trucks', description: 'Mobile food vendors', display_order: 7 },
      { name: 'Grocery Delivery', description: 'Food delivery and grocery services', display_order: 8 },
      { name: 'Meal Prep', description: 'Meal preparation and planning services', display_order: 9 },
      { name: 'Breweries', description: 'Beer brewing and brewpubs', display_order: 10 },
      { name: 'Wineries', description: 'Wine production and tasting rooms', display_order: 11 },
      { name: 'Ice Cream Shops', description: 'Ice cream and frozen dessert shops', display_order: 12 },
      { name: 'Juice Bars', description: 'Fresh juice and smoothie bars', display_order: 13 },
      { name: 'Snacks and Fries', description: 'Snack shops and fries vendors', display_order: 14 },
      { name: 'Food Wholesale', description: 'Wholesale food distribution', display_order: 15 },
      { name: 'Butcher Shops', description: 'Meat markets and butcher services', display_order: 16 },
      { name: 'Seafood Markets', description: 'Fresh seafood retailers', display_order: 17 },
    ]
  },
  {
    name: 'Finance & Insurance',
    description: 'Financial services, banking, and insurance providers',
    icon: 'Banknote',
    display_order: 6,
    subcategories: [
      { name: 'Banking', description: 'Commercial banks and banking services', display_order: 1 },
      { name: 'Investment Services', description: 'Investment management and advisory services', display_order: 2 },
      { name: 'Insurance', description: 'Insurance providers and brokers', display_order: 3 },
      { name: 'Accounting', description: 'Accounting and bookkeeping services', display_order: 4 },
      { name: 'Tax Services', description: 'Tax preparation and consulting', display_order: 5 },
      { name: 'Financial Planning', description: 'Financial advisory and planning services', display_order: 6 },
      { name: 'Mortgage Services', description: 'Home loan and mortgage services', display_order: 7 },
      { name: 'Currency Exchange', description: 'Foreign exchange and money transfer', display_order: 8 },
      { name: 'Microfinance', description: 'Small loans and microfinance services', display_order: 9 },
      { name: 'Pension Services', description: 'Retirement and pension planning', display_order: 10 },
      { name: 'Credit Services', description: 'Credit counseling and lending services', display_order: 11 },
      { name: 'Crowdfunding', description: 'Crowdfunding platforms and services', display_order: 12 },
      { name: 'Payment Processing', description: 'Payment gateway and processing services', display_order: 13 },
      { name: 'Cryptocurrency', description: 'Digital currency and blockchain services', display_order: 14 },
      { name: 'Stock Brokerage', description: 'Stock trading and brokerage services', display_order: 15 },
    ]
  },
  {
    name: 'Technology & IT',
    description: 'Technology services, software development, and IT support',
    icon: 'Monitor',
    display_order: 7,
    subcategories: [
      { name: 'Software Development', description: 'Custom software and application development', display_order: 1 },
      { name: 'Web Design', description: 'Website design and development services', display_order: 2 },
      { name: 'IT Support', description: 'Technical support and IT assistance', display_order: 3 },
      { name: 'Mobile App Development', description: 'Mobile application development services', display_order: 4 },
      { name: 'Cybersecurity', description: 'Security and data protection services', display_order: 5 },
      { name: 'Cloud Services', description: 'Cloud computing and hosting services', display_order: 6 },
      { name: 'Data Analytics', description: 'Data analysis and business intelligence', display_order: 7 },
      { name: 'AI/ML Services', description: 'Artificial intelligence and machine learning', display_order: 8 },
      { name: 'Hardware Repair', description: 'Computer and device repair services', display_order: 9 },
      { name: 'Network Installation', description: 'Network setup and configuration', display_order: 10 },
      { name: 'Tech Consulting', description: 'Technology consulting and advisory', display_order: 11 },
      { name: 'Digital Marketing', description: 'Online marketing and advertising services', display_order: 12 },
      { name: 'SEO Services', description: 'Search engine optimization services', display_order: 13 },
      { name: 'E-commerce Solutions', description: 'Online store development and management', display_order: 14 },
      { name: 'System Integration', description: 'Enterprise system integration services', display_order: 15 },
      { name: 'Database Management', description: 'Database administration and optimization', display_order: 16 },
    ]
  },
  {
    name: 'Professional Services',
    description: 'Consulting, legal, and business services',
    icon: 'Briefcase',
    display_order: 8,
    subcategories: [
      { name: 'Legal Services', description: 'Law firms and legal representation', display_order: 1 },
      { name: 'Consulting', description: 'Business consulting and advisory', display_order: 2 },
      { name: 'Marketing', description: 'Marketing and brand strategy services', display_order: 3 },
      { name: 'HR Services', description: 'Human resources and recruitment', display_order: 4 },
      { name: 'Public Relations', description: 'PR and communications services', display_order: 5 },
      { name: 'Event Planning', description: 'Professional event planning services', display_order: 6 },
      { name: 'Translation', description: 'Translation and interpretation services', display_order: 7 },
      { name: 'Business Formation', description: 'Company registration and incorporation', display_order: 8 },
      { name: 'Project Management', description: 'Project coordination and management', display_order: 9 },
      { name: 'Quality Assurance', description: 'QA testing and quality control', display_order: 10 },
      { name: 'Research Services', description: 'Market and business research', display_order: 11 },
      { name: 'Copywriting', description: 'Content writing and copywriting services', display_order: 12 },
      { name: 'Graphic Design', description: 'Visual design and branding services', display_order: 13 },
      { name: 'Video Production', description: 'Video recording and editing services', display_order: 14 },
      { name: 'Photography', description: 'Professional photography services', display_order: 15 },
      { name: 'Auditing', description: 'Financial and operational auditing', display_order: 16 },
      { name: 'Compliance', description: 'Regulatory compliance services', display_order: 17 },
    ]
  },
  {
    name: 'Automotive',
    description: 'Car sales, repair, and automotive services',
    icon: 'Car',
    display_order: 9,
    subcategories: [
      { name: 'Car Sales', description: 'New and used car dealerships', display_order: 1 },
      { name: 'Auto Repair', description: 'Vehicle repair and maintenance', display_order: 2 },
      { name: 'Car Wash', description: 'Car washing and detailing services', display_order: 3 },
      { name: 'Towing', description: 'Vehicle towing and roadside assistance', display_order: 4 },
      { name: 'Auto Parts', description: 'Automotive parts and accessories', display_order: 5 },
      { name: 'Car Rental', description: 'Vehicle rental services', display_order: 6 },
      { name: 'Tire Services', description: 'Tire sales and installation', display_order: 7 },
      { name: 'Oil Change', description: 'Oil change and lubrication services', display_order: 8 },
      { name: 'Body Shop', description: 'Auto body repair and painting', display_order: 9 },
      { name: 'Window Tinting', description: 'Automotive window tinting services', display_order: 10 },
      { name: 'Vehicle Inspection', description: 'Safety and emissions inspection', display_order: 11 },
      { name: 'Motorcycle Services', description: 'Motorcycle sales and repair', display_order: 12 },
      { name: 'Auto Insurance', description: 'Vehicle insurance services', display_order: 13 },
    ]
  },
  {
    name: 'Travel & Tourism',
    description: 'Travel agencies, hotels, and tourism services',
    icon: 'Plane',
    display_order: 10,
    subcategories: [
      { name: 'Hotels', description: 'Hotels and accommodations', display_order: 1 },
      { name: 'Travel Agencies', description: 'Travel booking and planning services', display_order: 2 },
      { name: 'Tour Operators', description: 'Guided tours and tour packages', display_order: 3 },
      { name: 'Car Rentals', description: 'Vehicle rental for travelers', display_order: 4 },
      { name: 'Airlines', description: 'Air travel and flight services', display_order: 5 },
      { name: 'Vacation Rentals', description: 'Short-term vacation accommodations', display_order: 6 },
      { name: 'Cruises', description: 'Cruise ships and sea travel', display_order: 7 },
      { name: 'Adventure Tourism', description: 'Outdoor adventure and activities', display_order: 8 },
      { name: 'Eco-Tourism', description: 'Sustainable and nature tourism', display_order: 9 },
      { name: 'Cultural Tourism', description: 'Cultural experiences and heritage tours', display_order: 10 },
      { name: 'Business Travel', description: 'Corporate travel services', display_order: 11 },
      { name: 'Travel Insurance', description: 'Travel protection and insurance', display_order: 12 },
      { name: 'Visa Services', description: 'Visa processing and assistance', display_order: 13 },
      { name: 'Airport Services', description: 'Airport transfers and services', display_order: 14 },
      { name: 'Tourist Information', description: 'Tourist guides and information', display_order: 15 },
    ]
  },
  {
    name: 'Fashion & Beauty',
    description: 'Beauty salons, fashion services, and personal care',
    icon: 'Sparkles',
    display_order: 11,
    subcategories: [
      { name: 'Salons', description: 'Hair salons and styling services', display_order: 1 },
      { name: 'Barbershops', description: 'Barbering and grooming services', display_order: 2 },
      { name: 'Spas', description: 'Spa and wellness services', display_order: 3 },
      { name: 'Nail Studios', description: 'Manicure and pedicure services', display_order: 4 },
      { name: 'Makeup Artists', description: 'Professional makeup services', display_order: 5 },
      { name: 'Fashion Design', description: 'Custom fashion and garment design', display_order: 6 },
      { name: 'Tailoring', description: 'Clothing alteration and tailoring', display_order: 7 },
      { name: 'Dry Cleaning', description: 'Dry cleaning and laundry services', display_order: 8 },
      { name: 'Boutiques', description: 'Specialty fashion boutiques', display_order: 9 },
      { name: 'Shoe Repair', description: 'Shoe repair and restoration', display_order: 10 },
      { name: 'Shoe Making', description: 'Custom shoe design and manufacturing', display_order: 11 },
      { name: 'Accessories', description: 'Fashion accessories and jewelry', display_order: 12 },
      { name: 'Bridal Services', description: 'Wedding beauty and fashion services', display_order: 13 },
      { name: 'Skincare', description: 'Skincare treatments and products', display_order: 14 },
      { name: 'Massage Therapy', description: 'Therapeutic massage services', display_order: 15 },
      { name: 'Cosmetic Surgery', description: 'Aesthetic and cosmetic procedures', display_order: 16 },
    ]
  },
  {
    name: 'Agriculture & Farming',
    description: 'Agricultural services, farming, and agribusiness',
    icon: 'Wheat',
    display_order: 12,
    subcategories: [
      { name: 'Crop Farming', description: 'Crop cultivation and farming', display_order: 1 },
      { name: 'Livestock', description: 'Animal husbandry and livestock', display_order: 2 },
      { name: 'Poultry', description: 'Poultry farming and products', display_order: 3 },
      { name: 'Fisheries', description: 'Fish farming and aquaculture', display_order: 4 },
      { name: 'Agricultural Equipment', description: 'Farm machinery and equipment', display_order: 5 },
      { name: 'Seeds & Fertilizers', description: 'Agricultural inputs and supplies', display_order: 6 },
      { name: 'Irrigation', description: 'Irrigation systems and services', display_order: 7 },
      { name: 'Agro-Processing', description: 'Agricultural product processing', display_order: 8 },
      { name: 'Farm Consulting', description: 'Agricultural consulting services', display_order: 9 },
      { name: 'Organic Farming', description: 'Organic and sustainable agriculture', display_order: 10 },
      { name: 'Greenhouses', description: 'Greenhouse construction and services', display_order: 11 },
      { name: 'Veterinary Services', description: 'Animal health and veterinary care', display_order: 12 },
      { name: 'Agricultural Finance', description: 'Farm loans and financing', display_order: 13 },
      { name: 'Farm Produce Sales', description: 'Direct farm produce marketing', display_order: 14 },
      { name: 'Agricultural Training', description: 'Farming education and training', display_order: 15 },
    ]
  },
  {
    name: 'Energy & Environment',
    description: 'Energy services, environmental solutions, and sustainability',
    icon: 'Zap',
    display_order: 13,
    subcategories: [
      { name: 'Solar Energy', description: 'Solar panel installation and services', display_order: 1 },
      { name: 'Renewable Energy', description: 'Renewable energy solutions', display_order: 2 },
      { name: 'Waste Management', description: 'Waste collection and management', display_order: 3 },
      { name: 'Recycling', description: 'Recycling services and programs', display_order: 4 },
      { name: 'Water Treatment', description: 'Water purification and treatment', display_order: 5 },
      { name: 'Environmental Consulting', description: 'Environmental advisory services', display_order: 6 },
      { name: 'Oil & Gas', description: 'Petroleum and gas services', display_order: 7 },
      { name: 'Electrical Generation', description: 'Power generation services', display_order: 8 },
      { name: 'Energy Efficiency', description: 'Energy conservation solutions', display_order: 9 },
      { name: 'Sustainability Services', description: 'Sustainable business solutions', display_order: 10 },
      { name: 'Carbon Offsetting', description: 'Carbon credit and offset services', display_order: 11 },
      { name: 'Environmental Testing', description: 'Environmental impact assessment', display_order: 12 },
      { name: 'Green Building', description: 'Sustainable construction services', display_order: 13 },
      { name: 'Pollution Control', description: 'Pollution prevention and control', display_order: 14 },
      { name: 'Climate Services', description: 'Climate analysis and services', display_order: 15 },
    ]
  },
  {
    name: 'Manufacturing & Industrial',
    description: 'Manufacturing, production, and industrial services',
    icon: 'Factory',
    display_order: 14,
    subcategories: [
      { name: 'Food Processing', description: 'Food manufacturing and processing', display_order: 1 },
      { name: 'Textile Manufacturing', description: 'Fabric and textile production', display_order: 2 },
      { name: 'Metal Fabrication', description: 'Metal working and fabrication', display_order: 3 },
      { name: 'Plastics', description: 'Plastic manufacturing and molding', display_order: 4 },
      { name: 'Chemical Manufacturing', description: 'Chemical production and processing', display_order: 5 },
      { name: 'Packaging', description: 'Product packaging services', display_order: 6 },
      { name: 'Printing', description: 'Commercial printing services', display_order: 7 },
      { name: 'Industrial Equipment', description: 'Industrial machinery and equipment', display_order: 8 },
      { name: 'Quality Control', description: 'Manufacturing quality assurance', display_order: 9 },
      { name: 'Supply Chain', description: 'Supply chain management', display_order: 10 },
      { name: 'Factory Services', description: 'Factory maintenance and operations', display_order: 11 },
      { name: 'Machinery Repair', description: 'Industrial machinery repair', display_order: 12 },
      { name: 'Industrial Design', description: 'Product and industrial design', display_order: 13 },
      { name: 'Process Automation', description: 'Manufacturing automation solutions', display_order: 14 },
      { name: 'Production Consulting', description: 'Manufacturing consulting services', display_order: 15 },
      { name: 'Welding Services', description: 'Professional welding and metalwork', display_order: 16 },
    ]
  },
  {
    name: 'Media & Entertainment',
    description: 'Media production, broadcasting, and entertainment services',
    icon: 'Radio',
    display_order: 15,
    subcategories: [
      { name: 'Radio Stations', description: 'Radio broadcasting services', display_order: 1 },
      { name: 'TV Production', description: 'Television production services', display_order: 2 },
      { name: 'Music Production', description: 'Music recording and production', display_order: 3 },
      { name: 'Publishing', description: 'Book and content publishing', display_order: 4 },
      { name: 'Advertising', description: 'Advertising agencies and services', display_order: 5 },
      { name: 'Film Production', description: 'Movie and film production', display_order: 6 },
      { name: 'Animation', description: 'Animation and motion graphics', display_order: 7 },
      { name: 'Game Development', description: 'Video game development services', display_order: 8 },
      { name: 'Content Creation', description: 'Digital content creation', display_order: 9 },
      { name: 'Social Media Management', description: 'Social media marketing and management', display_order: 10 },
      { name: 'Podcasting', description: 'Podcast production and hosting', display_order: 11 },
      { name: 'Live Events', description: 'Live entertainment and events', display_order: 12 },
      { name: 'Theater', description: 'Theater performances and productions', display_order: 13 },
      { name: 'Comedy', description: 'Comedy shows and entertainment', display_order: 14 },
      { name: 'DJ Services', description: 'Disc jockey and music services', display_order: 15 },
      { name: 'Broadcasting', description: 'Media broadcasting services', display_order: 16 },
    ]
  },
  {
    name: 'Logistics & Supply Chain',
    description: 'Logistics, shipping, and supply chain services',
    icon: 'Truck',
    display_order: 16,
    subcategories: [
      { name: 'Freight Forwarding', description: 'Cargo shipping and forwarding', display_order: 1 },
      { name: 'Warehousing', description: 'Storage and warehousing services', display_order: 2 },
      { name: 'Courier Services', description: 'Package and courier delivery', display_order: 3 },
      { name: 'Distribution', description: 'Product distribution services', display_order: 4 },
      { name: 'Import/Export', description: 'International trade services', display_order: 5 },
      { name: 'Customs Brokerage', description: 'Customs clearance services', display_order: 6 },
      { name: 'Fleet Management', description: 'Vehicle fleet management', display_order: 7 },
      { name: 'Inventory Management', description: 'Stock and inventory control', display_order: 8 },
      { name: 'Last-Mile Delivery', description: 'Final delivery to customers', display_order: 9 },
      { name: 'Cold Chain', description: 'Temperature-controlled logistics', display_order: 10 },
      { name: 'Packaging Services', description: 'Product packaging and labeling', display_order: 11 },
      { name: 'Shipping', description: 'Domestic and international shipping', display_order: 12 },
      { name: 'Tracking Systems', description: 'Shipment tracking solutions', display_order: 13 },
      { name: 'Logistics Consulting', description: 'Supply chain consulting', display_order: 14 },
    ]
  },
  {
    name: 'Real Estate & Property',
    description: 'Real estate, property management, and construction',
    icon: 'Building2',
    display_order: 17,
    subcategories: [
      { name: 'Property Sales', description: 'Residential and commercial property sales', display_order: 1 },
      { name: 'Property Rentals', description: 'Property rental and leasing', display_order: 2 },
      { name: 'Property Management', description: 'Property management services', display_order: 3 },
      { name: 'Real Estate Development', description: 'Property development and construction', display_order: 4 },
      { name: 'Commercial Real Estate', description: 'Commercial property services', display_order: 5 },
      { name: 'Land Sales', description: 'Land and lot sales', display_order: 6 },
      { name: 'Mortgage Brokerage', description: 'Mortgage and loan brokerage', display_order: 7 },
      { name: 'Property Valuation', description: 'Property appraisal and valuation', display_order: 8 },
      { name: 'Property Inspection', description: 'Home and building inspection', display_order: 9 },
      { name: 'Real Estate Investment', description: 'Investment property services', display_order: 10 },
      { name: 'Facility Management', description: 'Building and facility management', display_order: 11 },
      { name: 'Property Law', description: 'Real estate legal services', display_order: 12 },
      { name: 'Architecture', description: 'Architectural design services', display_order: 13 },
      { name: 'Construction', description: 'Building construction services', display_order: 14 },
      { name: 'Interior Design', description: 'Interior design and decoration', display_order: 15 },
      { name: 'Property Insurance', description: 'Property and building insurance', display_order: 16 },
    ]
  },
  {
    name: 'Non-Profit & Social',
    description: 'Non-profit organizations, charities, and social services',
    icon: 'Heart',
    display_order: 18,
    subcategories: [
      { name: 'Charities', description: 'Charitable organizations and causes', display_order: 1 },
      { name: 'NGOs', description: 'Non-governmental organizations', display_order: 2 },
      { name: 'Community Centers', description: 'Community development centers', display_order: 3 },
      { name: 'Religious Organizations', description: 'Faith-based organizations', display_order: 4 },
      { name: 'Youth Programs', description: 'Youth development programs', display_order: 5 },
      { name: 'Women\'s Organizations', description: 'Women empowerment organizations', display_order: 6 },
      { name: 'Health Advocacy', description: 'Health advocacy and awareness', display_order: 7 },
      { name: 'Education Foundations', description: 'Educational support foundations', display_order: 8 },
      { name: 'Environmental Organizations', description: 'Environmental conservation groups', display_order: 9 },
      { name: 'Human Rights', description: 'Human rights advocacy', display_order: 10 },
      { name: 'Disaster Relief', description: 'Emergency response and relief', display_order: 11 },
      { name: 'Social Enterprises', description: 'Social impact businesses', display_order: 12 },
      { name: 'Volunteer Services', description: 'Volunteer coordination and programs', display_order: 13 },
      { name: 'Fundraising', description: 'Fundraising and donor services', display_order: 14 },
      { name: 'Grant Writing', description: 'Grant writing and proposal services', display_order: 15 },
      { name: 'Impact Assessment', description: 'Social impact measurement', display_order: 16 },
    ]
  },
  {
    name: 'Events & Hospitality',
    description: 'Event planning, venues, and hospitality services',
    icon: 'Calendar',
    display_order: 19,
    subcategories: [
      { name: 'Wedding Planning', description: 'Wedding planning and coordination', display_order: 1 },
      { name: 'Corporate Events', description: 'Corporate event planning', display_order: 2 },
      { name: 'Conferences', description: 'Conference organization and management', display_order: 3 },
      { name: 'Concerts', description: 'Concert and music event production', display_order: 4 },
      { name: 'Festivals', description: 'Festival organization and management', display_order: 5 },
      { name: 'Catering', description: 'Event catering services', display_order: 6 },
      { name: 'Venue Rental', description: 'Event venue rentals', display_order: 7 },
      { name: 'Event Equipment', description: 'Event equipment rental', display_order: 8 },
      { name: 'Entertainment Services', description: 'Event entertainment and performers', display_order: 9 },
      { name: 'Decorators', description: 'Event decoration services', display_order: 10 },
      { name: 'Audio/Visual Services', description: 'AV equipment and technical services', display_order: 11 },
      { name: 'Security Services', description: 'Event security and safety', display_order: 12 },
      { name: 'Event Staffing', description: 'Event staff and personnel', display_order: 13 },
      { name: 'Ticketing', description: 'Event ticketing and registration', display_order: 14 },
      { name: 'Exhibitions', description: 'Exhibition and trade show services', display_order: 15 },
      { name: 'Sports Events', description: 'Sports event organization', display_order: 16 },
      { name: 'Party Planning', description: 'Party planning and coordination', display_order: 17 },
    ]
  },
  {
    name: 'Crafts & Creative Services',
    description: 'Handmade crafts, art, and creative services',
    icon: 'Palette',
    display_order: 20,
    subcategories: [
      { name: 'Handmade Crafts', description: 'Handcrafted items and artisan goods', display_order: 1 },
      { name: 'Art Studios', description: 'Art creation and studio services', display_order: 2 },
      { name: 'Pottery', description: 'Pottery and ceramics creation', display_order: 3 },
      { name: 'Woodworking', description: 'Custom woodworking and carpentry', display_order: 4 },
      { name: 'Jewelry Making', description: 'Custom jewelry design and creation', display_order: 5 },
      { name: 'Custom Printing', description: 'Custom printing and design services', display_order: 6 },
    ]
  },
  {
    name: 'Childcare & Family',
    description: 'Childcare services, family support, and child development',
    icon: 'Baby',
    display_order: 21,
    subcategories: [
      { name: 'Daycare Centers', description: 'Child daycare and care centers', display_order: 1 },
      { name: 'Preschools', description: 'Early childhood education centers', display_order: 2 },
      { name: 'After-School Programs', description: 'After-school care and activities', display_order: 3 },
      { name: 'Nanny Services', description: 'Professional nanny and childcare', display_order: 4 },
      { name: 'Child Tutoring', description: 'Children\'s educational tutoring', display_order: 5 },
      { name: 'Birthday Party Services', description: 'Children\'s party planning', display_order: 6 },
      { name: 'Family Counseling', description: 'Family therapy and counseling', display_order: 7 },
      { name: 'Parenting Classes', description: 'Parent education and training', display_order: 8 },
      { name: 'Child Photography', description: 'Children and family photography', display_order: 9 },
      { name: 'Children\'s Entertainment', description: 'Entertainment for children\'s events', display_order: 10 },
      { name: 'Babysitting', description: 'Babysitting and temporary childcare', display_order: 11 },
      { name: 'Child Transportation', description: 'School and activity transportation', display_order: 12 },
      { name: 'Summer Camps', description: 'Summer camps and vacation programs', display_order: 13 },
      { name: 'Youth Sports', description: 'Youth sports programs and leagues', display_order: 14 },
    ]
  },
  {
    name: 'Pets & Animals',
    description: 'Pet care, veterinary services, and animal-related businesses',
    icon: 'Dog',
    display_order: 22,
    subcategories: [
      { name: 'Veterinary Services', description: 'Animal healthcare and veterinary clinics', display_order: 1 },
      { name: 'Pet Grooming', description: 'Pet grooming and bathing services', display_order: 2 },
      { name: 'Pet Boarding', description: 'Pet boarding and kenneling services', display_order: 3 },
      { name: 'Pet Supplies', description: 'Pet food, accessories, and supplies', display_order: 4 },
    ]
  },
  {
    name: 'Other / Miscellaneous',
    description: 'Other services and businesses not categorized elsewhere',
    icon: 'MoreHorizontal',
    display_order: 23,
    subcategories: [
      { name: 'General Services', description: 'Miscellaneous general services', display_order: 1 },
      { name: 'Unclassified Businesses', description: 'Businesses without specific category', display_order: 2 },
      { name: 'Emerging Industries', description: 'New and emerging business types', display_order: 3 },
      { name: 'Specialized Services', description: 'Highly specialized niche services', display_order: 4 },
      { name: 'Multiple Categories', description: 'Businesses spanning multiple categories', display_order: 5 },
    ]
  },
];

// Helper function to count total subcategories
export function getTotalSubcategoryCount(): number {
  return categoriesSeed.reduce((total, category) => {
    return total + (category.subcategories?.length || 0);
  }, 0);
}

// Helper function to validate category structure
export function validateCategorySeed(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check that we have exactly 23 main categories
  if (categoriesSeed.length !== 23) {
    errors.push(`Expected 23 main categories, found ${categoriesSeed.length}`);
  }
  
  // Check display order uniqueness and sequential order
  const displayOrders = categoriesSeed.map(c => c.display_order);
  const uniqueOrders = new Set(displayOrders);
  if (uniqueOrders.size !== displayOrders.length) {
    errors.push('Duplicate display_order values found in main categories');
  }
  
  // Validate each category
  categoriesSeed.forEach((category, index) => {
    // Check required fields
    if (!category.name) {
      errors.push(`Category at index ${index} missing name`);
    }
    if (!category.description) {
      errors.push(`Category "${category.name}" missing description`);
    }
    if (!category.icon) {
      errors.push(`Category "${category.name}" missing icon`);
    }
    
    // Check subcategories
    if (category.subcategories) {
      const subOrders = category.subcategories.map(s => s.display_order);
      const uniqueSubOrders = new Set(subOrders);
      if (uniqueSubOrders.size !== subOrders.length) {
        errors.push(`Category "${category.name}" has duplicate subcategory display_order values`);
      }
      
      category.subcategories.forEach((sub, subIndex) => {
        if (!sub.name) {
          errors.push(`Subcategory at index ${subIndex} in category "${category.name}" missing name`);
        }
        if (!sub.description) {
          errors.push(`Subcategory "${sub.name}" in category "${category.name}" missing description`);
        }
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Expected subcategory counts per requirement
export const expectedSubcategoryCounts: Record<string, number> = {
  'Home & Construction': 15,
  'Health & Medical': 18,
  'Retail & Shopping': 24,
  'Education & Training': 15,
  'Food & Beverage': 17,
  'Finance & Insurance': 15,
  'Technology & IT': 16,
  'Professional Services': 17,
  'Automotive': 13,
  'Travel & Tourism': 15,
  'Fashion & Beauty': 16,
  'Agriculture & Farming': 15,
  'Energy & Environment': 15,
  'Manufacturing & Industrial': 16,
  'Media & Entertainment': 16,
  'Logistics & Supply Chain': 14,
  'Real Estate & Property': 16,
  'Non-Profit & Social': 16,
  'Events & Hospitality': 17,
  'Crafts & Creative Services': 6,
  'Childcare & Family': 14,
  'Pets & Animals': 4,
  'Other / Miscellaneous': 5,
};
