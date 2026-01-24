// Simple script to generate placeholder PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ff9d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00b8ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#050510"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="${size / 3}" font-weight="bold" fill="#050510">GZ</text>
</svg>
`;

console.log('Generating PWA icons...');

sizes.forEach(size => {
    const svg = createSVG(size);
    const filename = `icon-${size}x${size}.png`;
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);

    // Save as SVG (you can convert to PNG using a tool like sharp or imagemagick)
    fs.writeFileSync(svgPath, svg);
    console.log(`✓ Generated ${filename} (SVG)`);
});

console.log('\n✅ Icon generation complete!');
console.log('📝 Note: SVG icons created. For production, convert to PNG using:');
console.log('   npm install sharp');
console.log('   or use an online converter');
