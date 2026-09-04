// generate-assets.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// 1. PASTE YOUR LUCIDE SVG CODE HERE 
// (You can copy this directly from lucide.dev/icons/target)
const lucideSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <circle cx="12" cy="12" r="6"/>
  <circle cx="12" cy="12" r="2"/>
</svg>
`;

// 2. Configuration
const OUTPUT_DIR = path.join(__dirname, 'assets', 'images');
const BRAND_COLOR = '#6B2D5C'; // Your Mystic Purple

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to render SVG to PNG
function generatePng(svgString, outputPath, width, height, isMonochrome = false) {
  // If it's a notification icon, it MUST be white on transparent
  let finalSvg = svgString;
  if (isMonochrome) {
    finalSvg = svgString.replace(/stroke="currentColor"/g, 'stroke="#FFFFFF"');
    finalSvg = finalSvg.replace(/fill="currentColor"/g, 'fill="#FFFFFF"');
    finalSvg = finalSvg.replace(/stroke="[^"]*"/g, 'stroke="#FFFFFF"');
  } else {
    // For the app icon, make it white so it pops against the background
    finalSvg = svgString.replace(/stroke="currentColor"/g, 'stroke="#FFFFFF"');
    finalSvg = finalSvg.replace(/fill="currentColor"/g, 'fill="#FFFFFF"');
  }

  const resvg = new Resvg(finalSvg, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`✅ Generated: ${outputPath}`);
}

// 3. Generate the Assets
console.log('🎨 Generating Girigo Assets from Lucide SVG...\n');

// App Icon Foreground (512x512)
generatePng(
  lucideSvg, 
  path.join(OUTPUT_DIR, 'android-icon-foreground.png'), 
  512, 512
);

// Notification Icon (Must be monochrome, 96x96 or 512x512)
generatePng(
  lucideSvg, 
  path.join(OUTPUT_DIR, 'notification-icon.png'), 
  512, 512, 
  true // isMonochrome
);

// Splash Icon (Optional, if you want the icon on the splash screen)
generatePng(
  lucideSvg, 
  path.join(OUTPUT_DIR, 'splash-icon.png'), 
  512, 512
);

console.log('\n Assets ready! You can now run `eas build`.');