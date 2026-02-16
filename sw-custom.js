// Custom Service Worker for MatchOra Ad Protection
// Works alongside existing sw.js (propeller tracking)

const CACHE_NAME = 'MatchOra-ads-v1';
const AD_URLS = [
    'https://otieu.com/4/9889886',
    'https://otieu.com/4/9879177',
    'https://otieu.com/4/9879176', 
    'https://otieu.com/4/9879175',
    'https://otieu.com/4/9879174',
    'https://otieu.com/4/9879172'
];

// Install event - cache ad resources
self.addEventListener('install', event => {
    console.log('🛡️ MatchOra Ad Protection SW installed');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Caching ad resources...');
            return cache.addAll(AD_URLS.map(url => new Request(url, {
                mode: 'no-cors',
                credentials: 'omit'
            })));
        }).catch(err => {
            console.log('⚠️ Cache failed, ads will load dynamically:', err);
        })
    );
});

// Fetch event - protect ad requests
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Check if this is one of our ad URLs
    if (AD_URLS.some(adUrl => url.includes(adUrl) || url.includes('otieu.com'))) {
        console.log('🛡️ Protecting ad request:', url);
        
        event.respondWith(
            // Try to serve from cache first
            caches.match(event.request).then(response => {
                if (response) {
                    console.log('✅ Serving ad from cache');
                    return response;
                }
                
                // If not in cache, fetch with anti-block techniques
                return fetch(event.request, {
                    mode: 'no-cors',
                    credentials: 'omit',
                    cache: 'no-cache'
                }).catch(error => {
                    console.log('❌ Ad fetch failed, using fallback:', error);
                    
                    // Fallback: Create a fake ad response
                    return new Response(`
                        <html>
                            <body style="margin:0;padding:0;background:#000;color:#fff;text-align:center;font-family:Arial;">
                                <div style="padding:20px;">
                                    <h3>Ad Content</h3>
                                    <p>Advertisement</p>
                                    <script>
                                        // Redirect to actual ad after a delay
                                        setTimeout(() => {
                                            window.top.location.href = '${url}';
                                        }, 1000);
                                    </script>
                                </div>
                            </body>
                        </html>
                    `, {
                        headers: {
                            'Content-Type': 'text/html',
                            'Cache-Control': 'no-cache'
                        }
                    });
                });
            })
        );
    }
    
    // For non-ad requests, let them pass through normally
    // This ensures we don't interfere with the existing sw.js
});

// Message event - handle ad loading requests
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'loadAd') {
        const adUrl = event.data.url;
        console.log('📡 Loading ad via service worker:', adUrl);
        
        // Load ad and send response back
        fetch(adUrl, {
            mode: 'no-cors',
            credentials: 'omit'
        }).then(response => {
            event.ports[0].postMessage({
                success: true,
                url: adUrl
            });
        }).catch(error => {
            console.log('❌ Ad load failed:', error);
            event.ports[0].postMessage({
                success: false,
                error: error.message
            });
        });
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🔄 MatchOra Ad Protection SW activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

console.log('🛡️ MatchOra Custom Service Worker loaded');
