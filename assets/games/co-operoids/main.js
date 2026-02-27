// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './_framework/dotnet.js'

const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
    .withDiagnosticTracing(true)
    .withApplicationArgumentsFromQuery()
    .create();

setModuleImports('main.js', {
    window: {
        location: {
            href: () => globalThis.window.location.href
        }
    }
});

var canvas = document.getElementById("canvas");
dotnet.instance.Module.canvas = canvas;

// Populate the emscripten virtual filesystem with game content
const FS = dotnet.instance.Module.FS;
FS.mkdir('/Content');
FS.mkdir('/Content/Effects');
FS.mkdir('/Content/Fonts');
FS.mkdir('/Content/Sounds');
FS.mkdir('/Content/Textures');

const contentFiles = [
    'Effects/TransitionSpriteEffect.xnb',
    'Fonts/UI.xnb',
    'Fonts/UIGamepad.xnb',
    'Fonts/UIhint.xnb',
    'Fonts/UI.zh-CN.xnb',
    'Fonts/UIhint.zh-CN.xnb',
    'Sounds/click1.xnb',
    'Sounds/Cyber-Grunge-City.xnb',
    'Sounds/Cyber-Grunge.xnb',
    'Sounds/explosion2.xnb',
    'Sounds/forceField_000.xnb',
    'Sounds/laserSmall_001.xnb',
    'Sounds/rumble3.xnb',
    'Sounds/Steamtech-Mayhem_Looping-1.xnb',
    'Sounds/thrusterFire_000.xnb',
    'Sounds/tone1.xnb',
    'Sounds/upgrade4.xnb',
    'Sounds/upgrade5.xnb',
    'Textures/logo.xnb',
    'Textures/splash.xnb',
    'Textures/simpleSpace_sheet.xnb',
    'Textures/transition.xnb',
    'Textures/xbox-series_sheet_default.xnb'
];

// --- Splash screen + progress bar ---
const splashCanvas = document.getElementById('splash');
splashCanvas.width = 1280;
splashCanvas.height = 720;
const splashCtx = splashCanvas.getContext('2d');

const splashImage = new Image();
splashImage.src = 'splash.png';
await new Promise(resolve => {
    splashImage.onload = resolve;
    splashImage.onerror = resolve;
});

const drawSplashProgress = (loaded, total, currentFile) => {
    splashCtx.clearRect(0, 0, 1280, 720);
    splashCtx.fillStyle = '#000';
    splashCtx.fillRect(0, 0, 1280, 720);

    // Draw splash image centred with aspect ratio preserved (object-fit: contain)
    if (splashImage.complete && splashImage.naturalWidth > 0) {
        const iw = splashImage.naturalWidth;
        const ih = splashImage.naturalHeight;
        const scale = Math.min(1280 / iw, 720 / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (1280 - dw) / 2;
        const dy = (720 - dh) / 2;
        splashCtx.drawImage(splashImage, dx, dy, dw, dh);
    }

    const barX = 80;
    const barY = 672;
    const barW = 1120;
    const barH = 18;
    const progress = total > 0 ? loaded / total : 0;

    // Progress track
    splashCtx.fillStyle = 'rgba(0,0,0,0.55)';
    splashCtx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    splashCtx.fillStyle = '#222';
    splashCtx.fillRect(barX, barY, barW, barH);

    // Progress fill
    if (progress > 0) {
        const grad = splashCtx.createLinearGradient(barX, barY, barX + barW, barY);
        grad.addColorStop(0, '#f0a020');
        grad.addColorStop(1, '#ffe040');
        splashCtx.fillStyle = grad;
        splashCtx.fillRect(barX, barY, barW * progress, barH);
    }

    // Status text
    splashCtx.font = '14px monospace';
    splashCtx.textAlign = 'center';
    splashCtx.fillStyle = 'rgba(0,0,0,0.6)';
    splashCtx.fillText(currentFile ? `Loading ${loaded}/${total}: ${currentFile}` : 'Loading...', 640 + 1, barY - 7);
    splashCtx.fillStyle = '#ddd';
    splashCtx.fillText(currentFile ? `Loading ${loaded}/${total}: ${currentFile}` : 'Loading...', 640, barY - 8);
};

drawSplashProgress(0, contentFiles.length, '');
// ------------------------------------

let loadedCount = 0;
for (const file of contentFiles) {
    drawSplashProgress(loadedCount, contentFiles.length, file);
    console.log(`Loading: ${file} (${loadedCount}/${contentFiles.length})`);
    const resp = await fetch(`Content/${file}`);
    if (!resp.ok) {
        console.error(`Failed to fetch Content/${file}: ${resp.status}`);
        loadedCount++;
        continue;
    }
    const data = new Uint8Array(await resp.arrayBuffer());
    FS.writeFile(`/Content/${file}`, data);
    console.log(`Loaded Content/${file} into VFS (${data.length} bytes)`);
    loadedCount++;
    drawSplashProgress(loadedCount, contentFiles.length, file);
}

drawSplashProgress(contentFiles.length, contentFiles.length, '');
console.log('Content loading complete, starting game...');

// Fade out the splash canvas now all content is loaded
splashCanvas.style.opacity = '0';
setTimeout(() => { splashCanvas.style.display = 'none'; }, 650);

await dotnet.run();