/**
 * Script to download category images from free stock photo sites
 * 
 * Downloads appropriate images for each category from Pexels/Unsplash
 * and saves them to public/images/categories/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map category names to appropriate free stock photo URLs from Pexels
// These are curated, high-quality images that match each category theme
const categoryImageUrls: Record<string, string> = {
  'Home & Construction': 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Health & Medical': 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Retail & Shopping': 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Education & Training': 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Food & Beverage': 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Finance & Insurance': 'https://images.pexels.com/photos/210742/pexels-photo-210742.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Technology & IT': 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Professional Services': 'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Automotive': 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Travel & Tourism': 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Fashion & Beauty': 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Agriculture & Farming': 'https://images.pexels.com/photos/325944/pexels-photo-325944.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Energy & Environment': 'https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Manufacturing & Industrial': 'https://images.pexels.com/photos/236722/pexels-photo-236722.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Media & Entertainment': 'https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Logistics & Supply Chain': 'https://images.pexels.com/photos/4391478/pexels-photo-4391478.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Real Estate & Property': 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Non-Profit & Social': 'https://images.pexels.com/photos/339620/pexels-photo-339620.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Events & Hospitality': 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Crafts & Creative Services': 'https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Childcare & Family': 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Pets & Animals': 'https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Other / Miscellaneous': 'https://images.pexels.com/photos/371589/pexels-photo-371589.jpeg?auto=compress&cs=tinysrgb&w=800',
  // Additional mappings for variations
  'Services': 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Products': 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Opportunities': 'https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Education': 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Health': 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Technology': 'https://images.pexels.com/photos/325111/pexels-photo-325111.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Food': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Real Estate': 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Events': 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=800',
};

/**
 * Download image from URL and save to file
 */
function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if error
      reject(err);
    });
  });
}

/**
 * Create slug from category name
 */
function createSlug(name: string): string {
  return name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function downloadCategoryImages() {
  console.log('🖼️  Downloading category images from Pexels...\n');

  // Create directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'categories');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`📁 Created directory: ${imagesDir}\n`);
  }

  // Get all categories from database
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .order('display_order');

  if (error) {
    console.error('❌ Failed to fetch categories:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${categories?.length || 0} main categories\n`);

  let downloaded = 0;
  let skipped = 0;
  let updated = 0;

  for (const category of categories || []) {
    const imageUrl = categoryImageUrls[category.name];
    
    if (!imageUrl) {
      console.log(`⚠️  No image URL mapped for: ${category.name}`);
      skipped++;
      continue;
    }

    const slug = category.slug || createSlug(category.name);
    const filename = `${slug}.jpg`;
    const filepath = path.join(imagesDir, filename);
    const publicPath = `/images/categories/${filename}`;

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ Already exists: ${category.name} (${filename})`);
      
      // Update database to use local image
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: publicPath })
        .eq('id', category.id);

      if (!updateError) {
        updated++;
      }
      
      continue;
    }

    try {
      console.log(`⬇️  Downloading: ${category.name}...`);
      await downloadImage(imageUrl, filepath);
      
      const stats = fs.statSync(filepath);
      console.log(`   ✅ Saved: ${filename} (${Math.round(stats.size / 1024)}KB)`);
      
      // Update database with new image path
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: publicPath })
        .eq('id', category.id);

      if (updateError) {
        console.log(`   ⚠️  Failed to update database: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated database record`);
        updated++;
      }
      
      downloaded++;
      
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Failed to download: ${error}`);
      skipped++;
    }
    
    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`   - Downloaded: ${downloaded}`);
  console.log(`   - Already existed: ${(categories?.length || 0) - downloaded - skipped}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Database updated: ${updated}`);
  console.log('\n✨ Done! All category images downloaded and database updated.');
  console.log(`\n📸 Images saved to: ${imagesDir}`);
  console.log('\n🎨 Attribution: All images from Pexels.com (Free to use under Pexels License)');
}

downloadCategoryImages().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
