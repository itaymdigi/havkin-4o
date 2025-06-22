const fs = require('fs');
const path = require('path');

// Read the TTF font file
const fontPath = path.join(__dirname, '../public/fonts/DavidLibre-Regular.ttf');
const fontBuffer = fs.readFileSync(fontPath);

// Convert to base64
const fontBase64 = fontBuffer.toString('base64');

// Create the output file
const outputContent = `// Auto-generated font data for DavidLibre
export const DAVID_LIBRE_FONT_BASE64 = '${fontBase64}';
`;

// Write to src/lib/fonts.ts
const outputPath = path.join(__dirname, '../src/lib/fonts.ts');
fs.writeFileSync(outputPath, outputContent);

console.log('Font converted successfully to src/lib/fonts.ts');
console.log(`Font size: ${Math.round(fontBase64.length / 1024)} KB`); 