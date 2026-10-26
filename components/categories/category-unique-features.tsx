"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Shirt,
  Watch,
  ShoppingBag,
  Footprints,
  UtensilsCrossed,
  Pizza,
  Coffee,
  IceCream,
  Home,
  Building2,
  Warehouse,
  Castle,
  Car,
  Bike,
  Truck,
  Ship,
  Wrench,
  Hammer,
  Paintbrush,
  Zap,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Code,
  BookOpen,
  Music,
  Film,
  Gamepad,
  Dumbbell,
  Trophy,
  Target,
  Activity,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  type LucideIcon
} from "lucide-react";

interface CategoryUniqueFeaturesProps {
  categorySlug: string;
  categoryName: string;
  className?: string;
}

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
}

// Unique features for each category
const CATEGORY_FEATURES: Record<string, FeatureItem[]> = {
  electronics: [
    {
      icon: Smartphone,
      title: "Latest Smartphones",
      description: "Browse the newest iPhone, Samsung, and Android devices",
      href: "/categories/electronics?subcategory=smartphones",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Laptop,
      title: "Laptops & Computers",
      description: "Gaming PCs, workstations, and ultrabooks",
      href: "/categories/electronics?subcategory=laptops",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Headphones,
      title: "Audio Equipment",
      description: "Headphones, speakers, and sound systems",
      href: "/categories/electronics?subcategory=audio",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Camera,
      title: "Cameras & Photography",
      description: "DSLRs, mirrorless cameras, and accessories",
      href: "/categories/electronics?subcategory=cameras",
      color: "from-green-500 to-teal-500"
    }
  ],
  fashion: [
    {
      icon: Shirt,
      title: "Clothing",
      description: "Men's and women's fashion, streetwear, and designer brands",
      href: "/categories/fashion?subcategory=clothing",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Watch,
      title: "Watches & Jewelry",
      description: "Luxury watches, fashion jewelry, and accessories",
      href: "/categories/fashion?subcategory=watches",
      color: "from-yellow-500 to-amber-500"
    },
    {
      icon: ShoppingBag,
      title: "Bags & Accessories",
      description: "Handbags, backpacks, wallets, and more",
      href: "/categories/fashion?subcategory=bags",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Footprints,
      title: "Footwear",
      description: "Sneakers, boots, heels, and casual shoes",
      href: "/categories/fashion?subcategory=footwear",
      color: "from-cyan-500 to-blue-500"
    }
  ],
  food: [
    {
      icon: Pizza,
      title: "Ready Meals",
      description: "Hot meals, takeout, and restaurant food",
      href: "/categories/food?subcategory=ready-meals",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: UtensilsCrossed,
      title: "Catering Services",
      description: "Event catering, party packages, and bulk orders",
      href: "/categories/food?subcategory=catering",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Coffee,
      title: "Beverages",
      description: "Coffee, tea, juices, and specialty drinks",
      href: "/categories/food?subcategory=beverages",
      color: "from-amber-500 to-yellow-500"
    },
    {
      icon: IceCream,
      title: "Desserts & Snacks",
      description: "Cakes, pastries, ice cream, and treats",
      href: "/categories/food?subcategory=desserts",
      color: "from-pink-500 to-rose-500"
    }
  ],
  "real-estate": [
    {
      icon: Home,
      title: "Residential Properties",
      description: "Houses, apartments, and condos for sale or rent",
      href: "/categories/real-estate?subcategory=residential",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Building2,
      title: "Commercial Spaces",
      description: "Offices, retail spaces, and business properties",
      href: "/categories/real-estate?subcategory=commercial",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Warehouse,
      title: "Industrial Properties",
      description: "Warehouses, factories, and industrial land",
      href: "/categories/real-estate?subcategory=industrial",
      color: "from-gray-500 to-slate-500"
    },
    {
      icon: Castle,
      title: "Luxury Estates",
      description: "Premium properties, villas, and luxury homes",
      href: "/categories/real-estate?subcategory=luxury",
      color: "from-yellow-500 to-amber-500"
    }
  ],
  properties: [
    {
      icon: Home,
      title: "Residential Properties",
      description: "Houses, apartments, and condos for sale or rent",
      href: "/categories/properties?subcategory=residential",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Building2,
      title: "Commercial Spaces",
      description: "Offices, retail spaces, and business properties",
      href: "/categories/properties?subcategory=commercial",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Warehouse,
      title: "Industrial Properties",
      description: "Warehouses, factories, and industrial land",
      href: "/categories/properties?subcategory=industrial",
      color: "from-gray-500 to-slate-500"
    },
    {
      icon: Castle,
      title: "Luxury Estates",
      description: "Premium properties, villas, and luxury homes",
      href: "/categories/properties?subcategory=luxury",
      color: "from-yellow-500 to-amber-500"
    }
  ],
  vehicles: [
    {
      icon: Car,
      title: "Cars & SUVs",
      description: "New and used cars, sedans, and SUVs",
      href: "/categories/vehicles?subcategory=cars",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: Bike,
      title: "Motorcycles & Bikes",
      description: "Motorbikes, scooters, and bicycles",
      href: "/categories/vehicles?subcategory=motorcycles",
      color: "from-orange-500 to-yellow-500"
    },
    {
      icon: Truck,
      title: "Trucks & Commercial",
      description: "Pickup trucks, vans, and commercial vehicles",
      href: "/categories/vehicles?subcategory=trucks",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Ship,
      title: "Boats & Marine",
      description: "Boats, jet skis, and marine equipment",
      href: "/categories/vehicles?subcategory=marine",
      color: "from-cyan-500 to-teal-500"
    }
  ],
  services: [
    {
      icon: Wrench,
      title: "Home Repair",
      description: "Plumbing, electrical, and general maintenance",
      href: "/categories/services?subcategory=home-repair",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Paintbrush,
      title: "Creative Services",
      description: "Design, photography, and content creation",
      href: "/categories/services?subcategory=creative",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Code,
      title: "Tech Services",
      description: "Web development, IT support, and software",
      href: "/categories/services?subcategory=tech",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Zap,
      title: "Quick Services",
      description: "Delivery, cleaning, and on-demand help",
      href: "/categories/services?subcategory=quick",
      color: "from-yellow-500 to-amber-500"
    }
  ],
  jobs: [
    {
      icon: Briefcase,
      title: "Full-Time Jobs",
      description: "Permanent positions and career opportunities",
      href: "/categories/jobs?subcategory=full-time",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Clock,
      title: "Part-Time & Gigs",
      description: "Flexible work and freelance opportunities",
      href: "/categories/jobs?subcategory=part-time",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: GraduationCap,
      title: "Internships",
      description: "Student positions and training opportunities",
      href: "/categories/jobs?subcategory=internships",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: HeartPulse,
      title: "Healthcare Jobs",
      description: "Medical, nursing, and healthcare positions",
      href: "/categories/jobs?subcategory=healthcare",
      color: "from-red-500 to-rose-500"
    }
  ],
  books: [
    {
      icon: BookOpen,
      title: "Textbooks",
      description: "Educational books and academic materials",
      href: "/categories/books?subcategory=textbooks",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Film,
      title: "Fiction & Novels",
      description: "Stories, literature, and creative writing",
      href: "/categories/books?subcategory=fiction",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Business & Finance",
      description: "Self-help, business strategy, and finance",
      href: "/categories/books?subcategory=business",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Gamepad,
      title: "Comics & Manga",
      description: "Graphic novels, comics, and manga series",
      href: "/categories/books?subcategory=comics",
      color: "from-orange-500 to-red-500"
    }
  ],
  sports: [
    {
      icon: Dumbbell,
      title: "Gym Equipment",
      description: "Weights, machines, and fitness gear",
      href: "/categories/sports?subcategory=gym",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: Activity,
      title: "Outdoor Sports",
      description: "Camping, hiking, and outdoor adventure gear",
      href: "/categories/sports?subcategory=outdoor",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Trophy,
      title: "Team Sports",
      description: "Football, basketball, and team equipment",
      href: "/categories/sports?subcategory=team",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Sports Apparel",
      description: "Athletic wear, shoes, and accessories",
      href: "/categories/sports?subcategory=apparel",
      color: "from-purple-500 to-pink-500"
    }
  ],
  home: [
    {
      icon: Home,
      title: "Furniture",
      description: "Sofas, beds, tables, and home furnishings",
      href: "/categories/home?subcategory=furniture",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Sparkles,
      title: "Decor & Art",
      description: "Wall art, decorations, and home accents",
      href: "/categories/home?subcategory=decor",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Zap,
      title: "Appliances",
      description: "Kitchen and home appliances",
      href: "/categories/home?subcategory=appliances",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Shield,
      title: "Home Security",
      description: "Security systems, cameras, and safety",
      href: "/categories/home?subcategory=security",
      color: "from-green-500 to-emerald-500"
    }
  ],
  beauty: [
    {
      icon: Sparkles,
      title: "Skincare",
      description: "Cleansers, moisturizers, and treatments",
      href: "/categories/beauty?subcategory=skincare",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Paintbrush,
      title: "Makeup",
      description: "Cosmetics, lipsticks, and beauty products",
      href: "/categories/beauty?subcategory=makeup",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Sparkles,
      title: "Haircare",
      description: "Shampoos, conditioners, and styling products",
      href: "/categories/beauty?subcategory=haircare",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: HeartPulse,
      title: "Wellness",
      description: "Vitamins, supplements, and health products",
      href: "/categories/beauty?subcategory=wellness",
      color: "from-green-500 to-emerald-500"
    }
  ]
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
};

export function CategoryUniqueFeatures({ categorySlug, categoryName, className = "" }: CategoryUniqueFeaturesProps) {
  const features = CATEGORY_FEATURES[categorySlug];

  // If no unique features defined for this category, don't render anything
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Popular in {categoryName}
        </h2>
        <p className="text-gray-400">
          Explore the most popular subcategories and find exactly what you need
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
            >
              <Link
                href={feature.href}
                className="block group"
              >
                <motion.div
                  className="relative overflow-hidden rounded-xl bg-gray-800/50 border border-gray-700/50 p-5 h-full hover:border-gray-600 transition-all duration-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon */}
                  <div className="mb-4">
                    <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-naija-green transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-4 flex items-center text-sm text-naija-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <motion.div
                      className="ml-1"
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                    >
                      →
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
