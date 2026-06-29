import { copyFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const imagesDir = path.resolve('images');
const maxWidth = 1400;

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walk(fullPath));
            continue;
        }

        if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
}

async function compress(file) {
    const before = (await stat(file)).size;
    if (before < 200 * 1024) return null;

    const image = sharp(file, { failOn: 'none' });
    const metadata = await image.metadata();
    const pipeline = metadata.width > maxWidth
        ? image.resize({ width: maxWidth, withoutEnlargement: true })
        : image;

    const ext = path.extname(file).toLowerCase();
    let output;

    if (ext === '.png') {
        output = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
    } else if (ext === '.webp') {
        output = await pipeline.webp({ quality: 82 }).toBuffer();
    } else {
        output = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    }

    if (output.length >= before) return null;

    const tempFile = `${file}.tmp`;
    await writeFile(tempFile, output);
    await unlink(file).catch(() => {});
    await copyFile(tempFile, file);
    await unlink(tempFile).catch(() => {});
    return { file, before, after: output.length };
}

const files = await walk(imagesDir);
const results = [];

for (const file of files) {
    const result = await compress(file);
    if (result) results.push(result);
}

results.sort((a, b) => (b.before - b.after) - (a.before - a.after));

for (const { file, before, after } of results) {
    const saved = ((before - after) / 1024).toFixed(1);
    console.log(`saved ${saved} KB  ${path.relative(imagesDir, file)}`);
}

console.log(`\nCompressed ${results.length} images.`);
