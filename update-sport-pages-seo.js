// Script to update all sport pages with 11/10 SEO
const fs = require('fs');
const path = require('path');

const sports = ['basketball', 'tennis', 'ufc', 'rugby', 'baseball'];

const sportIcons = {
  basketball: '🏀',
  tennis: '🎾', 
  ufc: '🥊',
  rugby: '🏉',
  baseball: '⚾'
};

const sportDescriptions = {
  basketball: 'Watch basketball live streams online free. NBA games, college basketball, international basketball matches.',
  tennis: 'Watch tennis live streams online free. Grand Slam tournaments, ATP, WTA matches, Wimbledon, US Open.',
  ufc: 'Watch UFC live streams online free. MMA fights, UFC events, boxing matches, combat sports.',
  rugby: 'Watch rugby live streams online free. Six Nations, Rugby World Cup, Premiership, international rugby.',
  baseball: 'Watch baseball live streams online free. MLB games, World Series, baseball matches, baseball streaming.'
};

const sportKeywords = {
  basketball: 'basketball live stream, NBA streaming, basketball games live, NBA live stream free',
  tennis: 'tennis live stream, tennis streaming, grand slam live, Wimbledon live stream',
  ufc: 'UFC live stream, MMA streaming, UFC fights live, MMA fights free',
  rugby: 'rugby live stream, rugby streaming, six nations live, rugby world cup stream',
  baseball: 'baseball live stream, MLB streaming, baseball games live, MLB live stream free'
};

const sportLeagues = {
  basketball: [
    { name: 'NBA', icon: '🏀', country: 'USA' },
    { name: 'College Basketball', icon: '🎓', country: 'USA' },
    { name: 'EuroLeague', icon: '🌍', country: 'Europe' },
    { name: 'WNBA', icon: '👩', country: 'USA' }
  ],
  tennis: [
    { name: 'Wimbledon', icon: '🌱', country: 'UK' },
    { name: 'US Open', icon: '🇺🇸', country: 'USA' },
    { name: 'French Open', icon: '🇫🇷', country: 'France' },
    { name: 'Australian Open', icon: '🇦🇺', country: 'Australia' }
  ],
  ufc: [
    { name: 'UFC Events', icon: '🥊', country: 'USA' },
    { name: 'Bellator', icon: '⚔️', country: 'USA' },
    { name: 'ONE Championship', icon: '🌏', country: 'Asia' },
    { name: 'Boxing', icon: '🥊', country: 'Global' }
  ],
  rugby: [
    { name: 'Six Nations', icon: '🏆', country: 'Europe' },
    { name: 'Rugby World Cup', icon: '🌍', country: 'Global' },
    { name: 'Premiership', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England' },
    { name: 'Super Rugby', icon: '🌏', country: 'Southern Hemisphere' }
  ],
  baseball: [
    { name: 'MLB', icon: '⚾', country: 'USA' },
    { name: 'World Series', icon: '🏆', country: 'USA' },
    { name: 'Playoffs', icon: '🎯', country: 'USA' },
    { name: 'Spring Training', icon: '🌸', country: 'USA' }
  ]
};

// Read the football template as base
const footballTemplate = fs.readFileSync(path.join(__dirname, 'views', 'football.html'), 'utf8');

sports.forEach(sport => {
  console.log(`🔄 Updating ${sport}.html with 11/10 SEO...`);
  
  let sportTemplate = footballTemplate
    .replace(/football/g, sport)
    .replace(/Football/g, sport.charAt(0).toUpperCase() + sport.slice(1))
    .replace(/FOOTBALL/g, sport.toUpperCase())
    .replace(/⚽/g, sportIcons[sport])
    .replace(/{{sport\.name}}/g, sport.charAt(0).toUpperCase() + sport.slice(1))
    .replace(/{{sport\.description}}/g, sportDescriptions[sport])
    .replace(/{{sport\.keywords}}/g, sportKeywords[sport])
    .replace(/{{sport\.image}}/g, `https://matchora.live/images/${sport}-og.jpg`)
    .replace(/{{seo\.title}}/g, `${sport.charAt(0).toUpperCase() + sport.slice(1)} Live Streams | MatchOra - Free ${sport.charAt(0).toUpperCase() + sport.slice(1)} Streaming`)
    .replace(/{{seo\.description}}/g, sportDescriptions[sport])
    .replace(/{{seo\.keywords}}/g, sportKeywords[sport])
    .replace(/{{seo\.canonical}}/g, `https://matchora.live/${sport}`)
    .replace(/{{seo\.ogTitle}}/g, `${sport.charAt(0).toUpperCase() + sport.slice(1)} Live Streams | MatchOra`)
    .replace(/{{seo\.ogDescription}}/g, sportDescriptions[sport])
    .replace(/{{seo\.ogImage}}/g, `https://matchora.live/images/${sport}-og.jpg`)
    .replace(/{{seo\.twitterCard}}/g, 'summary_large_image')
    .replace(/{{seo\.twitterTitle}}/g, `${sport.charAt(0).toUpperCase() + sport.slice(1)} Live Streams | MatchOra`)
    .replace(/{{seo\.twitterDescription}}/g, sportDescriptions[sport])
    .replace(/{{seo\.twitterImage}}/g, `https://matchora.live/images/${sport}-og.jpg`);

  // Update league links
  const leagues = sportLeagues[sport];
  let leagueLinks = '';
  leagues.forEach(league => {
    leagueLinks += `
                    <a href="/${sport}/${league.name.toLowerCase().replace(/\s+/g, '-')}" class="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-center transition-colors">
                        <div class="text-2xl mb-2">${league.icon}</div>
                        <div class="font-semibold">${league.name}</div>
                        <div class="text-xs text-gray-400">${league.country}</div>
                    </a>`;
  });

  sportTemplate = sportTemplate.replace(
    /<a href="\/football\/premier-league".*?<\/a>/gs,
    leagueLinks
  );

  // Write the updated template
  fs.writeFileSync(path.join(__dirname, 'views', `${sport}.html`), sportTemplate);
  console.log(`✅ ${sport}.html updated with 11/10 SEO!`);
});

console.log('🎉 All sport pages updated with 11/10 SEO optimization!');
