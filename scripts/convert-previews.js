/**
 * Convert all Preview-*.png files in /public to WebP format.
 * Uses sharp (already in devDependencies).
 *
 * Usage:  node scripts/convert-previews.js
 *
 * After running, update image references in PlateDetailPage.tsx
 * from .png to .webp.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const files = fs.readdirSync(publicDir).filter(f =>
    f.endsWith('.png') && f.startsWith('Preview-')
);

console.log(`Found ${files.length} Preview PNG files to convert.\n`);

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

(async () => {
    for (const file of files) {
        const input = path.join(publicDir, file);
        const output = path.join(publicDir, file.replace('.png', '.webp'));

        // Skip if WebP already exists
        if (fs.existsSync(output)) {
            console.log(`  SKIP  ${file} (WebP already exists)`);
            skipped++;
            continue;
        }

        const stats = fs.statSync(input);
        totalBefore += stats.size;

        try {
            await sharp(input)
                .webp({ quality: 85, effort: 4 })
                .toFile(output);

            const newStats = fs.statSync(output);
            totalAfter += newStats.size;
            const saved = ((1 - newStats.size / stats.size) * 100).toFixed(1);
            console.log(
                `  OK    ${file}  ${(stats.size / 1024 / 1024).toFixed(2)} MB → ${(newStats.size / 1024 / 1024).toFixed(2)} MB  (${saved}% smaller)`
            );
            converted++;
        } catch (err) {
            console.error(`  FAIL  ${file}: ${err.message}`);
        }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Converted: ${converted}  |  Skipped: ${skipped}`);
    console.log(`Before:    ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
    console.log(`After:     ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Saved:     ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB  (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\nNext step: Update image paths in PlateDetailPage.tsx from .png to .webp`);
})();
