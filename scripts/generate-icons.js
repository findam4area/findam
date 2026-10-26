// Simple script to generate placeholder PWA icons
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size
sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#00C853"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">FA</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

// Create placeholder shortcut icons
const shortcutIcons = ['create-icon', 'inventory-icon', 'messages-icon'];
shortcutIcons.forEach(name => {
  const svg = `<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#15A3C7"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">+</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `${name}.svg`), svg);
  console.log(`Created ${name}.svg`);
});

console.log('\nAll placeholder icons created successfully!');
console.log('Note: These are SVG placeholders. For production, replace with proper PNG icons.');
