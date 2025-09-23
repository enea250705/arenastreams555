#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of sport pages to update
const sportPages = [
    'basketball.html',
    'tennis.html', 
    'ufc.html',
    'rugby.html',
    'baseball.html'
];

const adScript = `    <!-- Advanced Ad System -->
    <script src="/js/advanced-ads.js"></script>
    
    <!-- Service Worker for Ad Control -->
    <script>
        if ('serviceWorker' in navigator) {
            // Register original service worker (propeller tracking)
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Propeller Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Propeller Service Worker registration failed:', error);
                });
            
            // Register custom ad protection service worker
            navigator.serviceWorker.register('/sw-custom.js')
                .then(registration => {
                    console.log('🛡️ ArenaStreams Ad Protection SW registered:', registration);
                })
                .catch(error => {
                    console.log('❌ ArenaStreams Ad Protection SW registration failed:', error);
                });
        }
    </script>`;

const oldServiceWorkerScript = `    <!-- Service Worker for Ad Control -->
    <script>
        if ('serviceWorker' in navigator) {
            // Register original service worker (propeller tracking)
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Propeller Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Propeller Service Worker registration failed:', error);
                });
            
            // Register custom ad protection service worker
            navigator.serviceWorker.register('/sw-custom.js')
                .then(registration => {
                    console.log('🛡️ ArenaStreams Ad Protection SW registered:', registration);
                })
                .catch(error => {
                    console.log('❌ ArenaStreams Ad Protection SW registration failed:', error);
                });
        }
    </script>`;

console.log('🚀 Adding Advanced Ad System to all sport pages...');

sportPages.forEach(page => {
    const filePath = path.join(__dirname, 'views', page);
    
    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if advanced ad system is already added
            if (content.includes('Advanced Ad System')) {
                console.log(`✅ ${page} already has Advanced Ad System`);
                return;
            }
            
            // Replace the old service worker script with the new one
            if (content.includes('Service Worker for Ad Control')) {
                content = content.replace(oldServiceWorkerScript, adScript);
                console.log(`✅ Updated ${page} with Advanced Ad System`);
            } else {
                // If no service worker script found, add it before the schema script
                const schemaIndex = content.indexOf('<script type="application/ld+json">');
                if (schemaIndex !== -1) {
                    content = content.slice(0, schemaIndex) + adScript + '\n\n' + content.slice(schemaIndex);
                    console.log(`✅ Added Advanced Ad System to ${page}`);
                } else {
                    console.log(`⚠️ Could not find insertion point in ${page}`);
                }
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            
        } catch (error) {
            console.error(`❌ Error updating ${page}:`, error.message);
        }
    } else {
        console.log(`⚠️ File not found: ${page}`);
    }
});

console.log('🎉 Advanced Ad System integration complete!');


const fs = require('fs');
const path = require('path');

// List of sport pages to update
const sportPages = [
    'basketball.html',
    'tennis.html', 
    'ufc.html',
    'rugby.html',
    'baseball.html'
];

const adScript = `    <!-- Advanced Ad System -->
    <script src="/js/advanced-ads.js"></script>
    
    <!-- Service Worker for Ad Control -->
    <script>
        if ('serviceWorker' in navigator) {
            // Register original service worker (propeller tracking)
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Propeller Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Propeller Service Worker registration failed:', error);
                });
            
            // Register custom ad protection service worker
            navigator.serviceWorker.register('/sw-custom.js')
                .then(registration => {
                    console.log('🛡️ ArenaStreams Ad Protection SW registered:', registration);
                })
                .catch(error => {
                    console.log('❌ ArenaStreams Ad Protection SW registration failed:', error);
                });
        }
    </script>`;

const oldServiceWorkerScript = `    <!-- Service Worker for Ad Control -->
    <script>
        if ('serviceWorker' in navigator) {
            // Register original service worker (propeller tracking)
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Propeller Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Propeller Service Worker registration failed:', error);
                });
            
            // Register custom ad protection service worker
            navigator.serviceWorker.register('/sw-custom.js')
                .then(registration => {
                    console.log('🛡️ ArenaStreams Ad Protection SW registered:', registration);
                })
                .catch(error => {
                    console.log('❌ ArenaStreams Ad Protection SW registration failed:', error);
                });
        }
    </script>`;

console.log('🚀 Adding Advanced Ad System to all sport pages...');

sportPages.forEach(page => {
    const filePath = path.join(__dirname, 'views', page);
    
    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if advanced ad system is already added
            if (content.includes('Advanced Ad System')) {
                console.log(`✅ ${page} already has Advanced Ad System`);
                return;
            }
            
            // Replace the old service worker script with the new one
            if (content.includes('Service Worker for Ad Control')) {
                content = content.replace(oldServiceWorkerScript, adScript);
                console.log(`✅ Updated ${page} with Advanced Ad System`);
            } else {
                // If no service worker script found, add it before the schema script
                const schemaIndex = content.indexOf('<script type="application/ld+json">');
                if (schemaIndex !== -1) {
                    content = content.slice(0, schemaIndex) + adScript + '\n\n' + content.slice(schemaIndex);
                    console.log(`✅ Added Advanced Ad System to ${page}`);
                } else {
                    console.log(`⚠️ Could not find insertion point in ${page}`);
                }
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            
        } catch (error) {
            console.error(`❌ Error updating ${page}:`, error.message);
        }
    } else {
        console.log(`⚠️ File not found: ${page}`);
    }
});

console.log('🎉 Advanced Ad System integration complete!');
