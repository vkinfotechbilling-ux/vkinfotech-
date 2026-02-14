import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

console.log(`🔍 Scanning for server build in: ${distDir}`);

try {
    const entries = fs.readdirSync(distDir, { withFileTypes: true });

    // Look for the hashed directory (e.g., 019c...)
    // It should be a directory, not 'assets' or 'fonts'
    const buildDir = entries.find(dirent =>
        dirent.isDirectory() &&
        !['assets', 'fonts'].includes(dirent.name) &&
        /^[0-9a-f_]+$/.test(dirent.name) // Simple check for hash-like name
    );

    if (!buildDir) {
        console.error("❌ Could not find hashed build directory in dist/");
        console.error("   Available directories:", entries.filter(e => e.isDirectory()).map(e => e.name).join(', '));
        process.exit(1);
    }

    const entryPath = path.join(distDir, buildDir.name, 'index.js');
    console.log(`🚀 Found server entry: ${entryPath}`);

    if (!fs.existsSync(entryPath)) {
        console.error(`❌ Entry file does not exist: ${entryPath}`);
        process.exit(1);
    }

    // Import the server bundle
    console.log("⚡ Starting server...");
    await import(path.join('file://', entryPath));

} catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
}
