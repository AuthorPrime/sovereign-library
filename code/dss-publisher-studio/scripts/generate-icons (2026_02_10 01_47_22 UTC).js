#!/usr/bin/env node
/**
 * Generate sovereignty diamond icons for Electron app.
 * Creates SVG → PNG (256x256) → ICO (multi-res).
 *
 * Dependencies: sharp, png-to-ico
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Sovereignty diamond SVG — gold on void black
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0d078"/>
      <stop offset="50%" stop-color="#c9a84c"/>
      <stop offset="100%" stop-color="#8a6d2b"/>
    </linearGradient>
    <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c9a84c" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#8a6d2b" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Void background -->
  <rect width="256" height="256" fill="#0a0a0f" rx="32"/>

  <!-- Subtle glow -->
  <circle cx="128" cy="128" r="90" fill="url(#innerGrad)" opacity="0.15"/>

  <!-- Outer diamond -->
  <path d="M128 28 L228 128 L128 228 L28 128 Z"
        stroke="url(#goldGrad)" stroke-width="3" fill="none" opacity="0.9"/>

  <!-- Middle diamond -->
  <path d="M128 58 L198 128 L128 198 L58 128 Z"
        fill="url(#innerGrad)" stroke="#c9a84c" stroke-width="1.5" opacity="0.5"/>

  <!-- Inner diamond (solid core) -->
  <path d="M128 88 L168 128 L128 168 L88 128 Z"
        fill="url(#goldGrad)" opacity="0.7"/>

  <!-- Center point -->
  <circle cx="128" cy="128" r="4" fill="#f0d078"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG
const svgPath = path.join(publicDir, 'icon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('Created icon.svg');

// Try to convert using sharp if available
async function convert() {
  try {
    const sharp = require('sharp');

    // Create 256x256 PNG
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(256, 256)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, 'icon.png'), pngBuffer);
    console.log('Created icon.png (256x256)');

    // Create multiple sizes for ICO
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = [];

    for (const size of sizes) {
      const buf = await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(buf);
    }

    // Try png-to-ico
    try {
      const pngToIco = require('png-to-ico');
      const icoBuffer = await pngToIco(pngBuffers);
      fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);
      console.log('Created icon.ico (multi-resolution)');
    } catch (e) {
      // Fallback: just use 256px PNG renamed
      console.log('png-to-ico not available, using PNG as fallback for ico');
      fs.writeFileSync(path.join(publicDir, 'icon.ico'), pngBuffer);
    }

    console.log('Icon generation complete!');
  } catch (e) {
    console.log('sharp not available:', e.message);
    console.log('SVG icon created. Install sharp to generate PNG/ICO:');
    console.log('  npm install --save-dev sharp png-to-ico');
    console.log('  node scripts/generate-icons.js');
  }
}

convert();
