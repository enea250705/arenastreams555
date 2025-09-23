// 11/10 SEO Configuration - Absolute Domination
const advancedSEOConfig = {
  // Core Web Vitals Optimization
  performance: {
    // LCP (Largest Contentful Paint) < 2.5s
    lcpTarget: 2500,
    // FID (First Input Delay) < 100ms
    fidTarget: 100,
    // CLS (Cumulative Layout Shift) < 0.1
    clsTarget: 0.1,
    
    // Optimization techniques
    techniques: [
      'critical-css-inline',
      'preconnect-resources',
      'lazy-loading-images',
      'compression-gzip',
      'browser-caching',
      'cdn-optimization',
      'minify-html-css-js',
      'optimize-images-webp'
    ]
  },

  // Advanced Schema Markup
  schema: {
    types: [
      'WebSite',
      'Organization', 
      'WebPage',
      'BreadcrumbList',
      'SportsActivity',
      'FAQPage',
      'HowTo',
      'Article',
      'VideoObject',
      'Event'
    ],
    
    // Rich snippets optimization
    richSnippets: {
      faq: true,
      howTo: true,
      breadcrumbs: true,
      organization: true,
      events: true,
      videos: true
    }
  },

  // Featured Snippets Optimization
  featuredSnippets: {
    // Target question-answer format
    questions: [
      'How to watch {sport} live streams?',
      'Is {sport} streaming free?',
      'What {sport} leagues are available?',
      'How to stream {sport} matches?',
      'Best {sport} streaming sites?'
    ],
    
    // Answer format optimization
    answerFormat: {
      maxLength: 160,
      includeKeywords: true,
      structuredFormat: true,
      includeSteps: true
    }
  },

  // Advanced Internal Linking
  internalLinking: {
    strategy: 'topic-clusters',
    
    // Hub pages (high authority)
    hubs: [
      '/football',
      '/basketball', 
      '/tennis',
      '/ufc',
      '/rugby',
      '/baseball'
    ],
    
    // Topic clusters
    clusters: {
      football: [
        '/football/premier-league',
        '/football/champions-league',
        '/football/la-liga',
        '/football/serie-a',
        '/football/bundesliga',
        '/football/world-cup',
        '/football/euro-cup'
      ],
      basketball: [
        '/basketball/nba',
        '/basketball/college',
        '/basketball/international',
        '/basketball/wnba',
        '/basketball/euroleague'
      ]
    },
    
    // Link equity distribution
    linkEquity: {
      homepage: 100,
      sportPages: 80,
      leaguePages: 60,
      matchPages: 40
    }
  },

  // Country-Specific SEO
  countrySEO: {
    enabled: true,
    countries: [
      { code: 'US', name: 'United States', language: 'en-US' },
      { code: 'GB', name: 'United Kingdom', language: 'en-GB' },
      { code: 'CA', name: 'Canada', language: 'en-CA' },
      { code: 'AU', name: 'Australia', language: 'en-AU' },
      { code: 'DE', name: 'Germany', language: 'de-DE' },
      { code: 'ES', name: 'Spain', language: 'es-ES' },
      { code: 'FR', name: 'France', language: 'fr-FR' },
      { code: 'IT', name: 'Italy', language: 'it-IT' },
      { code: 'BR', name: 'Brazil', language: 'pt-BR' },
      { code: 'MX', name: 'Mexico', language: 'es-MX' }
    ],
    
    // Hreflang implementation
    hreflang: true,
    
    // Localized content
    localizedContent: {
      keywords: true,
      descriptions: true,
      titles: true,
      content: true
    }
  },

  // Advanced Keyword Strategy
  keywords: {
    // Primary keywords (high volume, high competition)
    primary: {
      football: ['football live stream', 'soccer streaming', 'premier league live'],
      basketball: ['basketball live stream', 'NBA streaming', 'basketball games live'],
      tennis: ['tennis live stream', 'tennis streaming', 'grand slam live'],
      ufc: ['UFC live stream', 'MMA streaming', 'UFC fights live'],
      rugby: ['rugby live stream', 'rugby streaming', 'six nations live'],
      baseball: ['baseball live stream', 'MLB streaming', 'baseball games live']
    },
    
    // Long-tail keywords (lower competition, higher conversion)
    longTail: {
      football: [
        'watch premier league live free',
        'champions league streaming online',
        'la liga matches live stream',
        'serie a football streaming',
        'bundesliga live matches'
      ],
      basketball: [
        'NBA live stream free',
        'basketball streaming online',
        'college basketball live',
        'NBA playoffs streaming',
        'basketball games today'
      ]
    },
    
    // Semantic keywords (LSI - Latent Semantic Indexing)
    semantic: {
      football: ['soccer', 'football matches', 'live football', 'streaming football', 'football online'],
      basketball: ['NBA games', 'basketball matches', 'live basketball', 'streaming basketball', 'basketball online']
    }
  },

  // Content Strategy
  content: {
    // Content clusters
    clusters: {
      'How to Watch': [
        'How to watch football live streams',
        'How to watch basketball live streams',
        'How to watch tennis live streams',
        'How to watch UFC live streams',
        'How to watch rugby live streams',
        'How to watch baseball live streams',
        'How to watch American football live streams'
      ],
      'Free Streaming': [
        'Free football streaming sites',
        'Free basketball streaming sites',
        'Free tennis streaming sites',
        'Free UFC streaming sites',
        'Free rugby streaming sites',
        'Free baseball streaming sites',
        'Free American football streaming sites'
      ],
      'Live Sports': [
        'Live football matches today',
        'Live basketball games today',
        'Live tennis matches today',
        'Live UFC fights today',
        'Live rugby matches today',
        'Live baseball games today',
        'Live American football games today'
      ]
    },
    
    // Content freshness
    freshness: {
      matchPreviews: 'daily',
      matchRecaps: 'daily',
      leagueTables: 'weekly',
      playerStats: 'weekly',
      teamNews: 'daily'
    }
  },

  // Technical SEO
  technical: {
    // URL structure
    urlStructure: {
      sport: '/{sport}',
      league: '/{sport}/{league}',
      match: '/match/{team1}-vs-{team2}-{date}',
      team: '/{sport}/team/{team-name}',
      player: '/{sport}/player/{player-name}'
    },
    
    // Canonical URLs
    canonical: {
      enforce: true,
      trailingSlash: false,
      www: false,
      https: true
    },
    
    // XML Sitemaps
    sitemaps: {
      main: '/sitemap.xml',
      sports: '/sitemap-sports.xml',
      matches: '/sitemap-matches.xml',
      images: '/sitemap-images.xml',
      videos: '/sitemap-videos.xml'
    },
    
    // Robots.txt
    robots: {
      allow: ['/'],
      disallow: ['/admin/', '/api/', '/private/'],
      crawlDelay: 1,
      sitemaps: true
    }
  },

  // Analytics & Monitoring
  analytics: {
    // SEO metrics to track
    metrics: [
      'organic-traffic',
      'keyword-rankings',
      'click-through-rate',
      'impressions',
      'core-web-vitals',
      'page-speed',
      'mobile-usability',
      'structured-data-coverage'
    ],
    
    // Tools integration
    tools: [
      'google-search-console',
      'google-analytics',
      'google-page-speed-insights',
      'screaming-frog',
      'ahrefs',
      'semrush'
    ]
  }
};

// Export for use in server
module.exports = advancedSEOConfig;
