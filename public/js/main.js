// Main JavaScript for MatchOra - Streamed.pk API only v2.1
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu handling is done in individual templates
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.addEventListener('click', function() {
            if (this.form && this.form.checkValidity()) {
                this.innerHTML = '⏳ Loading...';
                this.disabled = true;
            }
        });
    });

    // Auto-refresh for live matches (every 30 seconds) - Streamed.pk API only
    if (window.location.pathname === '/') {
        setInterval(function() {
            // Only refresh if user is not interacting with the page
            if (document.hidden) return;
            
            fetch('/api/streamed/matches/live')
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        updateMatchCount(data.length);
                    }
                })
                .catch(error => console.log('Auto-refresh failed:', error));
        }, 30000);
    }

    function updateMatchCount(count) {
        const countElement = document.querySelector('[data-match-count]');
        if (countElement) {
            countElement.textContent = count;
        }
    }
});

// Merge Streamed.pk data with locally added admin matches
async function loadSportMatches(sport) {
    try {
        console.log(`🔄 Loading ${sport} matches from Streamed.pk...`);
        
        // Use our proxy API (avoids CORS issues)
        const streamedResponse = await fetch(`/api/streamed/matches/${sport}`);
        const streamedData = await streamedResponse.json();
        
        // Handle the API response structure - prioritize direct array (matches API docs)
        let matches = [];
        if (Array.isArray(streamedData)) {
            matches = streamedData;
        } else if (streamedData.value && Array.isArray(streamedData.value)) {
            matches = streamedData.value;
        }
        
        // Note: American football filtering is handled server-side to avoid double filtering
        
        // Filter rugby matches to exclude NFL matches incorrectly categorized as rugby
        if (sport === 'rugby') {
            matches = matches.filter(match => {
                const title = match.title ? match.title.toLowerCase() : '';
                const id = match.id ? match.id.toLowerCase() : '';
                
                // Exclude NFL/American football matches
                const nflKeywords = ['nfl:', 'nfl ', 'miami dolphins', 'buffalo bills', 'houston texans', 'jacksonville jaguars', 'pittsburgh steelers', 'new england patriots', 'dallas cowboys', 'chicago bears', 'green bay packers', 'cleveland browns', 'denver broncos', 'los angeles chargers', 'arizona cardinals', 'san francisco 49ers', 'kansas city chiefs', 'new york giants', 'detroit lions', 'baltimore ravens'];
                if (nflKeywords.some(keyword => title.includes(keyword) || id.includes(keyword))) {
                    return false;
                }
                
                // Exclude AFL (Australian Football League) matches
                const aflKeywords = [
                    'afl', 'australian football', 'hawthorn', 'geelong cats', 'collingwood',
                    'essendon', 'fremantle', 'brisbane lions', 'port adelaide', 'magpies',
                    'bombers', 'dockers', 'power', 'premiership football', 'afl womens'
                ];
                if (aflKeywords.some(keyword => title.includes(keyword) || id.includes(keyword))) {
                    return false;
                }
                
                // Keep actual rugby matches (NRL, NPC, Super Rugby, etc.)
                return true;
            });
        }
        
        let streamedProcessed = [];
        if (matches.length > 0) {
            streamedProcessed = matches.map(match => {
                // Handle different match structures
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    // Proper team structure
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    // Handle different title formats
                    if (match.title.includes(' vs ')) {
                        const titleParts = match.title.split(' vs ');
                        if (titleParts.length === 2) {
                            homeTeam = titleParts[0].trim();
                            awayTeam = titleParts[1].trim();
                        } else {
                            homeTeam = match.title;
                            awayTeam = 'Live';
                        }
                    } else if (match.title.includes(':')) {
                        // Handle format like "WNBA: Team A vs Team B"
                        const colonIndex = match.title.indexOf(':');
                        const afterColon = match.title.substring(colonIndex + 1).trim();
                        if (afterColon.includes(' vs ')) {
                            const parts = afterColon.split(' vs ');
                            if (parts.length === 2) {
                                homeTeam = parts[0].trim();
                                awayTeam = parts[1].trim();
                            } else {
                                homeTeam = afterColon;
                                awayTeam = 'Live';
                            }
                        } else {
                            homeTeam = afterColon;
                            awayTeam = 'Live';
                        }
                    } else {
                        // Single team or channel name
                        homeTeam = match.title;
                        awayTeam = 'Live';
                    }
                }
                
                // For motor sports and NFL channel matches, use the Streamed.pk ID as the slug directly
                if ((match.category === 'motor-sports' || match.category === 'american-football') && match.id && !match.title.includes(' vs ')) {
                    const slug = match.id;
                    console.log(`🔗 Generated slug for ${match.category} "${match.title}": ${slug}`);
                    
                    return {
                        id: match.id,
                        teamA: match.title,
                        teamB: 'Live',
                        competition: match.title || `${match.category.charAt(0).toUpperCase() + match.category.slice(1)} Event`,
                        date: new Date(match.date).toISOString(),
                        slug: slug,
                        teamABadge: '',
                        teamBBadge: '',
                        status: (() => {
                            if (match.category === 'motor-sports') {
                                return 'live'; // Motor sports events are usually live
                            } else {
                                // For NFL, check if it's a known channel/network
                                const channelKeywords = ['snf:', 'tnf:', 'mnf:', 'nfl network', 'espn', 'fox sports', 'cbs sports', 'nbc sports', 'abc sports'];
                                const isChannel = channelKeywords.some(keyword => match.title.toLowerCase().includes(keyword));
                                return isChannel ? 'live' : (match.date && match.date > 0 ? 'upcoming' : 'live');
                            }
                        })(),
                        poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                        popular: match.popular || false,
                        sources: match.sources || [],
                        category: match.category || match.category,
                        sport: match.category
                    };
                }
                
                // For other sports, generate slug normally
                // Handle date parsing - some matches have date: 0
                let matchDate;
                if (match.date && match.date > 0) {
                    matchDate = new Date(match.date).toISOString();
                } else {
                    // For matches with no date or date: 0, use current date + some hours
                    const now = new Date();
                    now.setHours(now.getHours() + 2); // 2 hours from now
                    matchDate = now.toISOString();
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(matchDate).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                console.log(`🔗 Generated slug for "${match.title}": ${slug}`);
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Match`,
                    date: matchDate,
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: getMatchStatus(match.date),
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || sport
                };
            });
            console.log(`📊 Found ${streamedProcessed.length} ${sport} matches from Streamed.pk`);
        } else {
            console.log(`⚠️ No ${sport} matches found in Streamed.pk`);
        }

        // Load locally added admin matches for this sport
        let localProcessed = [];
        try {
            const localRes = await fetch(`/api/matches/sport/${sport}`);
            const localJson = await localRes.json();
            const localMatches = (localJson && Array.isArray(localJson.matches)) ? localJson.matches : [];
            localProcessed = localMatches.map(m => {
                const iso = m.date ? new Date(m.date).toISOString() : new Date().toISOString();
                const slugBase = `${(m.teamA || 'Team A')}-vs-${(m.teamB || 'Team B')}-live-${iso.split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                return {
                    id: m.id,
                    teamA: m.teamA,
                    teamB: m.teamB,
                    competition: m.competition || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Match`,
                    date: iso,
                    slug: m.slug || slugBase,
                    teamABadge: m.teamABadge || '',
                    teamBBadge: m.teamBBadge || '',
                    status: m.status || getMatchStatus(m.date),
                    poster: '',
                    popular: false,
                    sources: [],
                    category: m.sport || sport
                };
            });
            console.log(`📝 Added ${localProcessed.length} local ${sport} matches from admin`);
        } catch (e) {
            console.log(`⚠️ Could not load local ${sport} matches:`, e);
        }

        // Deduplicate by slug (prefer Streamed.pk first, then local)
        const bySlug = new Map();
        [...streamedProcessed, ...localProcessed].forEach(item => {
            if (!item) return;
            const key = item.slug || `${item.teamA}-${item.teamB}-${item.date}`;
            if (!bySlug.has(key)) bySlug.set(key, item);
        });
        const combined = Array.from(bySlug.values());
        // Sort with live matches first, then by time within each group
        combined.sort((a, b) => {
            // First priority: live matches come before finished matches
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            
            // Second priority: within same status, sort by time (earliest first)
            return new Date(a.date) - new Date(b.date);
        });
        return combined;
    } catch (error) {
        console.error(`❌ Error loading ${sport} matches from Streamed.pk:`, error);
        return [];
    }
}

// Load live matches from both Streamed.pk and local admin data
async function loadLiveMatches() {
    try {
        console.log('🔴 Loading live matches from Streamed.pk...');
        
        const response = await fetch('/api/streamed/matches/live');
        const data = await response.json();
        
        // Handle the API response structure
        let matches = [];
        if (data.value && Array.isArray(data.value)) {
            matches = data.value;
        } else if (Array.isArray(data)) {
            matches = data;
        }
        
        let streamedProcessed = [];
        if (matches.length > 0) {
            streamedProcessed = matches.map(match => {
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    const titleParts = match.title.split(' vs ');
                    if (titleParts.length === 2) {
                        homeTeam = titleParts[0].trim();
                        awayTeam = titleParts[1].trim();
                    } else {
                        homeTeam = match.title;
                        awayTeam = 'Live';
                    }
                }
                
                // For motor sports and NFL channel matches, use the Streamed.pk ID as the slug directly
                if ((match.category === 'motor-sports' || match.category === 'american-football') && match.id && !match.title.includes(' vs ')) {
                    const slug = match.id;
                    console.log(`🔗 Generated slug for live ${match.category} "${match.title}": ${slug}`);
                    
                    return {
                        id: match.id,
                        teamA: match.title,
                        teamB: 'Live',
                        competition: match.title || `${match.category.charAt(0).toUpperCase() + match.category.slice(1)} Event`,
                        date: new Date(match.date).toISOString(),
                        slug: slug,
                        teamABadge: '',
                        teamBBadge: '',
                        status: (() => {
                            if (match.category === 'motor-sports') {
                                return 'live'; // Motor sports events are usually live
                            } else {
                                // For NFL, check if it's a known channel/network
                                const channelKeywords = ['snf:', 'tnf:', 'mnf:', 'nfl network', 'espn', 'fox sports', 'cbs sports', 'nbc sports', 'abc sports'];
                                const isChannel = channelKeywords.some(keyword => match.title.toLowerCase().includes(keyword));
                                return isChannel ? 'live' : (match.date && match.date > 0 ? 'upcoming' : 'live');
                            }
                        })(),
                        poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                        popular: match.popular || false,
                        sources: match.sources || [],
                        category: match.category || match.category,
                        sport: match.category
                    };
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(match.date).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                console.log(`🔗 Generated slug for live "${match.title}": ${slug}`);
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || 'Live Match',
                    date: new Date(match.date).toISOString(),
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: 'live',
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || 'live'
                };
            });
            console.log(`🔴 Found ${streamedProcessed.length} live matches from Streamed.pk`);
        } else {
            console.log('⚠️ No live matches found in Streamed.pk');
        }

        // Load local matches and filter those currently live
        let localLive = [];
        try {
            const localRes = await fetch('/api/matches');
            const localJson = await localRes.json();
            const localMatches = (localJson && Array.isArray(localJson.matches)) ? localJson.matches : [];
            localLive = localMatches
                .map(m => {
                    const iso = m.date ? new Date(m.date).toISOString() : new Date().toISOString();
                    const status = (m.status && m.status.toLowerCase() === 'live') ? 'live' : getMatchStatus(m.date);
                    const slugBase = `${(m.teamA || 'Team A')}-vs-${(m.teamB || 'Team B')}-live-${iso.split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    return {
                        id: m.id,
                        teamA: m.teamA,
                        teamB: m.teamB,
                        competition: m.competition || 'Live Match',
                        date: iso,
                        slug: m.slug || slugBase,
                        teamABadge: m.teamABadge || '',
                        teamBBadge: m.teamBBadge || '',
                        status: status,
                        poster: '',
                        popular: false,
                        sources: [],
                        category: m.sport || 'live'
                    };
                })
                .filter(m => m.status === 'live');
            console.log(`📝 Added ${localLive.length} local live matches from admin`);
        } catch (e) {
            console.log('⚠️ Could not load local matches for live list:', e);
        }

        // Deduplicate by slug
        const bySlug = new Map();
        [...streamedProcessed, ...localLive].forEach(item => {
            if (!item) return;
            const key = item.slug || `${item.teamA}-${item.teamB}-${item.date}`;
            if (!bySlug.has(key)) bySlug.set(key, item);
        });
        const combined = Array.from(bySlug.values());
        // Sort with live matches first, then by recency within each group
        combined.sort((a, b) => {
            // First priority: live matches come before finished matches
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            
            // Second priority: within same status, sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });
        return combined;
    } catch (error) {
        console.error('❌ Error loading live matches from Streamed.pk:', error);
        return [];
    }
}

// Load today's matches from both Streamed.pk and local admin data
async function loadTodaysMatches() {
    try {
        console.log('📅 Loading today\'s matches from Streamed.pk...');
        
        const response = await fetch('/api/streamed/matches/all-today');
        const data = await response.json();
        
        // Handle the API response structure
        let matches = [];
        if (data.value && Array.isArray(data.value)) {
            matches = data.value;
        } else if (Array.isArray(data)) {
            matches = data;
        }
        
        let streamedProcessed = [];
        if (matches.length > 0) {
            streamedProcessed = matches.map(match => {
                let homeTeam = 'Team A';
                let awayTeam = 'Team B';
                let teamABadge = '';
                let teamBBadge = '';
                
                if (match.teams && match.teams.home && match.teams.away) {
                    homeTeam = match.teams.home.name || 'Team A';
                    awayTeam = match.teams.away.name || 'Team B';
                    teamABadge = match.teams.home.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
                    teamBBadge = match.teams.away.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
                } else if (match.title) {
                    const titleParts = match.title.split(' vs ');
                    if (titleParts.length === 2) {
                        homeTeam = titleParts[0].trim();
                        awayTeam = titleParts[1].trim();
                    } else {
                        homeTeam = match.title;
                        awayTeam = 'Live';
                    }
                }
                
                // For motor sports and NFL channel matches, use the Streamed.pk ID as the slug directly
                if ((match.category === 'motor-sports' || match.category === 'american-football') && match.id && !match.title.includes(' vs ')) {
                    const slug = match.id;
                    console.log(`🔗 Generated slug for today ${match.category} "${match.title}": ${slug}`);
                    
                    return {
                        id: match.id,
                        teamA: match.title,
                        teamB: 'Live',
                        competition: match.title || `${match.category.charAt(0).toUpperCase() + match.category.slice(1)} Event`,
                        date: new Date(match.date).toISOString(),
                        slug: slug,
                        teamABadge: '',
                        teamBBadge: '',
                        status: (() => {
                            if (match.category === 'motor-sports') {
                                return 'live'; // Motor sports events are usually live
                            } else {
                                // For NFL, check if it's a known channel/network
                                const channelKeywords = ['snf:', 'tnf:', 'mnf:', 'nfl network', 'espn', 'fox sports', 'cbs sports', 'nbc sports', 'abc sports'];
                                const isChannel = channelKeywords.some(keyword => match.title.toLowerCase().includes(keyword));
                                return isChannel ? 'live' : (match.date && match.date > 0 ? 'upcoming' : 'live');
                            }
                        })(),
                        poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                        popular: match.popular || false,
                        sources: match.sources || [],
                        category: match.category || match.category,
                        sport: match.category
                    };
                }
                
                const slug = `${homeTeam}-vs-${awayTeam}-live-${new Date(match.date).toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                console.log(`🔗 Generated slug for today "${match.title}": ${slug}`);
                
                return {
                    id: match.id,
                    teamA: homeTeam,
                    teamB: awayTeam,
                    competition: match.title || 'Today\'s Match',
                    date: new Date(match.date).toISOString(),
                    slug: slug,
                    teamABadge: teamABadge,
                    teamBBadge: teamBBadge,
                    status: getMatchStatus(match.date),
                    poster: match.poster ? `https://streamed.pk/api/images/poster/${match.poster}` : '',
                    popular: match.popular || false,
                    sources: match.sources || [],
                    category: match.category || 'today'
                };
            });
            console.log(`📅 Found ${streamedProcessed.length} today's matches from Streamed.pk`);
        } else {
            console.log('⚠️ No today\'s matches found in Streamed.pk');
        }

        // Load local today's matches
        let localToday = [];
        try {
            const localRes = await fetch('/api/matches/today');
            const localJson = await localRes.json();
            const localMatches = (localJson && Array.isArray(localJson.matches)) ? localJson.matches : [];
            localToday = localMatches.map(m => {
                const iso = m.date ? new Date(m.date).toISOString() : new Date().toISOString();
                const slugBase = `${(m.teamA || 'Team A')}-vs-${(m.teamB || 'Team B')}-live-${iso.split('T')[0]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                return {
                    id: m.id,
                    teamA: m.teamA,
                    teamB: m.teamB,
                    competition: m.competition || 'Today\'s Match',
                    date: iso,
                    slug: m.slug || slugBase,
                    teamABadge: m.teamABadge || '',
                    teamBBadge: m.teamBBadge || '',
                    status: m.status || getMatchStatus(m.date),
                    poster: '',
                    popular: false,
                    sources: [],
                    category: m.sport || 'today'
                };
            });
            console.log(`📝 Added ${localToday.length} local today's matches from admin`);
        } catch (e) {
            console.log('⚠️ Could not load local today\'s matches:', e);
        }

        // Deduplicate by slug
        const bySlug = new Map();
        [...streamedProcessed, ...localToday].forEach(item => {
            if (!item) return;
            const key = item.slug || `${item.teamA}-${item.teamB}-${item.date}`;
            if (!bySlug.has(key)) bySlug.set(key, item);
        });
        const combined = Array.from(bySlug.values());
        // Sort with live matches first, then by time within each group
        combined.sort((a, b) => {
            // First priority: live matches come before finished matches
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            
            // Second priority: within same status, sort by time (earliest first for today's matches)
            return new Date(a.date) - new Date(b.date);
        });
        return combined;
    } catch (error) {
        console.error('❌ Error loading today\'s matches from Streamed.pk:', error);
        return [];
    }
}

// Get match status based on date
function getMatchStatus(matchDate) {
    const now = Date.now();
    let timestampMs;

    // Normalize various date formats (ISO string, seconds, milliseconds)
    if (typeof matchDate === 'string') {
        const parsed = Date.parse(matchDate);
        if (!isNaN(parsed)) {
            timestampMs = parsed;
        } else if (!isNaN(Number(matchDate))) {
            const n = Number(matchDate);
            timestampMs = n > 0 && n < 1e12 ? n * 1000 : n;
        }
    } else if (typeof matchDate === 'number') {
        timestampMs = matchDate > 0 && matchDate < 1e12 ? matchDate * 1000 : matchDate;
    }

    // Fallback: if invalid/missing date, treat as upcoming in ~2 hours
    if (!(timestampMs > 0)) {
        const fallback = new Date();
        fallback.setHours(fallback.getHours() + 2);
        timestampMs = fallback.getTime();
    }

    const diffMinutes = (timestampMs - now) / (1000 * 60);

    // Allow longer live window to account for OT/halftime delays etc.
    if (diffMinutes < -180) {
        return 'ended';
    } else if (diffMinutes < 0) {
        return 'live';
    } else if (diffMinutes < 45) {
        return 'starting-soon';
    } else {
        return 'upcoming';
    }
}

// Helper function to truncate team names intelligently for mobile
function truncateTeamName(name, maxLength = 15) {
    if (name.length <= maxLength) return name;
    
    // Try to truncate at a space if possible
    const truncated = name.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
}

// Helper function to get mobile-optimized team name
function getMobileTeamName(name) {
    // For mobile, use shorter truncation
    if (window.innerWidth < 640) { // sm breakpoint
        return truncateTeamName(name, 10);
    }
    return truncateTeamName(name, 18);
}

// Search functionality for teams and matches
let allMatches = [];
let searchTimeout;

// Google Analytics helper functions
function trackAnalyticsEvent(eventName, category, label, value) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
}

function trackMatchClick(matchId, teamA, teamB, competition) {
    trackAnalyticsEvent('match_click', 'Match Interaction', `${teamA} vs ${teamB}`, 1);
}

function trackStreamPlay(matchId, teamA, teamB) {
    trackAnalyticsEvent('stream_play', 'Streaming', `${teamA} vs ${teamB}`, 1);
}

function trackSearchUsage(searchTerm, resultsCount) {
    trackAnalyticsEvent('search_usage', 'Search', searchTerm, resultsCount);
}

// Search function to filter matches by team names
function searchMatches(searchTerm, containerId) {
    console.log(`🔍 Searching for "${searchTerm}" in container ${containerId} with ${allMatches.length} matches`);
    
    if (!searchTerm.trim()) {
        // If search is empty, show all matches
        console.log('🔍 Empty search, showing all matches');
        renderMatches(allMatches, containerId);
        return;
    }
    
    const filteredMatches = allMatches.filter(match => {
        const searchLower = searchTerm.toLowerCase();
        const teamA = match.teamA ? match.teamA.toLowerCase() : '';
        const teamB = match.teamB ? match.teamB.toLowerCase() : '';
        const competition = match.competition ? match.competition.toLowerCase() : '';
        const title = match.title ? match.title.toLowerCase() : '';
        
        const matches = teamA.includes(searchLower) || 
                       teamB.includes(searchLower) || 
                       competition.includes(searchLower) ||
                       title.includes(searchLower);
        
        if (matches) {
            console.log(`✅ Match found: ${teamA} vs ${teamB}`);
        }
        
        return matches;
    });
    
    console.log(`🎯 Found ${filteredMatches.length} matches for "${searchTerm}"`);
    renderMatches(filteredMatches, containerId);
    
    // Track search usage in Google Analytics
    trackSearchUsage(searchTerm, filteredMatches.length);
    
    // Show search results count
    const container = document.getElementById(containerId);
    if (container && container.previousElementSibling) {
        const resultsInfo = container.previousElementSibling.querySelector('.search-results-info');
        if (resultsInfo) {
            resultsInfo.textContent = `Found ${filteredMatches.length} match${filteredMatches.length !== 1 ? 'es' : ''} for "${searchTerm}"`;
            resultsInfo.style.display = 'block';
        }
    }
}

// Create search input component
function createSearchInput(containerId, placeholder = "Search teams or matches...") {
    return `
        <div class="mb-4">
            <div class="relative">
                <input 
                    type="text" 
                    id="search-input-${containerId}" 
                    class="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                    placeholder="${placeholder}"
                    autocomplete="off"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <button 
                    id="clear-search-${containerId}" 
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    style="display: none;"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="search-results-info text-sm text-gray-400 mt-2" style="display: none;"></div>
        </div>
    `;
}

// Initialize search functionality
function initializeSearch(containerId, placeholder) {
    console.log(`🔧 Initializing search for container: ${containerId}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.log(`❌ Container ${containerId} not found`);
        return;
    }
    
    // Check if search input already exists
    const existingSearchInput = document.getElementById(`search-input-${containerId}`);
    if (existingSearchInput) {
        console.log(`✅ Search input already exists for ${containerId}`);
        return;
    }
    
    // Add search input before the container
    const searchHTML = createSearchInput(containerId, placeholder);
    container.insertAdjacentHTML('beforebegin', searchHTML);
    
    const searchInput = document.getElementById(`search-input-${containerId}`);
    const clearButton = document.getElementById(`clear-search-${containerId}`);
    
    if (!searchInput) {
        console.log(`❌ Failed to create search input for ${containerId}`);
        return;
    }
    
    console.log(`✅ Search input created for ${containerId}`);
    
    // Search input event listener
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        console.log(`🔍 Search input changed: "${searchTerm}"`);
        
        // Show/hide clear button
        if (clearButton) {
            clearButton.style.display = searchTerm ? 'flex' : 'none';
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchMatches(searchTerm, containerId);
        }, 300);
    });
    
    // Clear button event listener
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            searchMatches('', containerId);
            searchInput.focus();
        });
    }
    
    console.log(`🎯 Search initialization complete for ${containerId}`);
}

// Enhanced renderMatches function with search support
function renderMatchesWithSearch(matches, containerId, placeholder = "Search teams or matches...") {
    console.log(`🔍 Initializing search for container: ${containerId} with ${matches.length} matches`);
    
    // Store all matches for search functionality
    allMatches = matches;
    
    // Always initialize search (in case it wasn't done before)
    initializeSearch(containerId, placeholder);
    
    // Render matches
    renderMatches(matches, containerId);
    
    console.log(`✅ Search initialized for ${containerId}, stored ${allMatches.length} matches`);
}

// Force re-render on window resize to update mobile layout
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Re-render all match containers on resize
        const containers = ['live-matches', 'upcoming-matches', 'matches-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.innerHTML.trim()) {
                // Trigger a re-render by dispatching a custom event
                const event = new CustomEvent('resizeMatches');
                container.dispatchEvent(event);
            }
        });
    }, 250);
});

// Render matches in the UI with improved mobile responsiveness
function renderMatches(matches, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">🏟️</div>
                <h3 class="text-xl font-semibold mb-2">No matches available</h3>
                <p class="text-gray-400">Check back later for upcoming matches</p>
            </div>
        `;
        return;
    }
    
    // Sort matches: Live matches first, then channels, then others
    const sortedMatches = matches.sort((a, b) => {
        // Helper function to check if a match is a channel (not a team vs team match)
        const isChannel = (match) => match.teamB === 'Live' || !match.title?.includes(' vs ');
        
        // Helper function to check if a match is a known NFL channel
            const isNFLChannel = (match) => {
                if (match.category !== 'american-football') return false;
                const channelKeywords = ['snf:', 'tnf:', 'mnf:', 'nfl network', 'espn', 'fox sports', 'cbs sports', 'nbc sports', 'abc sports'];
                return channelKeywords.some(keyword => match.title?.toLowerCase().includes(keyword));
            };
        
        // Priority 1: Live team vs team matches (actual games)
        const aIsLiveGame = a.status === 'live' && !isChannel(a) && !isNFLChannel(a);
        const bIsLiveGame = b.status === 'live' && !isChannel(b) && !isNFLChannel(b);
        
        // Priority 2: Live channels (24/7 streams)
        const aIsLiveChannel = a.status === 'live' && (isChannel(a) || isNFLChannel(a));
        const bIsLiveChannel = b.status === 'live' && (isChannel(b) || isNFLChannel(b));
        
        // Priority 3: Upcoming matches
        const aIsUpcoming = a.status === 'upcoming';
        const bIsUpcoming = b.status === 'upcoming';
        
        // Priority 4: Other statuses
        
        // Compare priorities
        if (aIsLiveGame && !bIsLiveGame) return -1;
        if (!aIsLiveGame && bIsLiveGame) return 1;
        
        if (aIsLiveChannel && !bIsLiveChannel && !bIsLiveGame) return -1;
        if (!aIsLiveChannel && bIsLiveChannel && !aIsLiveGame) return 1;
        
        if (aIsUpcoming && !bIsUpcoming && !bIsLiveChannel && !bIsLiveGame) return -1;
        if (!aIsUpcoming && bIsUpcoming && !aIsLiveChannel && !aIsLiveGame) return 1;
        
        // If same priority, sort by date (newer first)
        return new Date(b.date) - new Date(a.date);
    });
    
    container.innerHTML = sortedMatches.map(match => `
        <div class="bg-dark border border-gray-800 rounded-lg p-3 sm:p-6 hover:border-primary transition-colors">
            <!-- Ultra-compact mobile layout for team names -->
            <div class="mb-3 sm:mb-4">
                ${match.teamB !== 'Live' ? `
                <!-- Two team match - Horizontal layout: Team A vs Team B -->
                <div class="flex items-center justify-between space-x-2">
                    <!-- Team A -->
                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                        ${match.teamABadge ? `<img src="${match.teamABadge}" alt="${match.teamA}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamA}">${getMobileTeamName(match.teamA)}</span>
                    </div>
                    
                    <!-- VS separator -->
                    <span class="text-primary font-bold text-xs sm:text-sm flex-shrink-0">VS</span>
                    
                    <!-- Team B -->
                    <div class="flex items-center space-x-2 min-w-0 flex-1 justify-end">
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamB}">${getMobileTeamName(match.teamB)}</span>
                        ${match.teamBBadge ? `<img src="${match.teamBBadge}" alt="${match.teamB}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                    </div>
                </div>
                ` : `
                <!-- Single team/channel - Mobile optimized -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 min-w-0 flex-1">
                        ${match.teamABadge ? `<img src="${match.teamABadge}" alt="${match.teamA}" class="w-5 h-5 sm:w-8 sm:h-8 rounded-full flex-shrink-0" onerror="this.style.display='none'">` : ''}
                        <span class="font-semibold text-xs sm:text-base truncate" title="${match.teamA}">${getMobileTeamName(match.teamA)}</span>
                    </div>
                    <span class="text-gray-400 text-xs flex-shrink-0">Live</span>
                </div>
                `}
            </div>
            
            <!-- Match info -->
            <div class="text-center mb-4">
                <p class="text-gray-400 text-xs sm:text-sm mb-1">${match.competition}</p>
                <p class="text-gray-300 text-xs sm:text-sm mb-2">${new Date(match.date).toLocaleString()}</p>
                <p class="text-gray-400 text-[11px] sm:text-xs">👀 <span class="viewer-count" data-slug="${match.slug}">0</span> watching</p>
                ${match.status === 'live' ? '<span class="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>' : ''}
                ${match.status === 'starting-soon' ? '<span class="inline-block bg-yellow-500 text-dark text-xs px-2 py-1 rounded-full">Starting Soon</span>' : ''}
                ${match.status === 'ended' ? '<span class="inline-block bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Ended</span>' : ''}
                ${match.status === 'upcoming' ? '<span class="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Upcoming</span>' : ''}
            </div>
            
            <!-- Watch button -->
            <a href="/match/${match.slug}" class="block w-full bg-primary text-dark font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-center hover:bg-yellow-400 transition-colors text-sm sm:text-base" onclick="trackMatchClick('${match.id}', '${match.teamA}', '${match.teamB}', '${match.competition}')">
                ${match.status === 'live' ? 'Watch Live' : match.status === 'starting-soon' ? 'Watch Soon' : 'Watch Stream'}
            </a>
        </div>
    `).join('');
    
    // Update live match count
    updateLiveMatchCount(sortedMatches);

    // After rendering, bulk load viewer counts for displayed slugs
    try {
        const viewerEls = container.querySelectorAll('.viewer-count[data-slug]');
        const slugs = Array.from(viewerEls).map(el => el.getAttribute('data-slug'));
        const unique = Array.from(new Set(slugs)).slice(0, 200);
        if (unique.length > 0) {
            fetch(`/api/viewers/bulk?slugs=${encodeURIComponent(unique.join(','))}`)
                .then(r => r.json())
                .then(data => {
                    const counts = (data && data.counts) || {};
                    viewerEls.forEach(el => {
                        const s = el.getAttribute('data-slug');
                        if (s && typeof counts[s] === 'number') {
                            el.textContent = counts[s];
                        }
                    });
                })
                .catch(() => {});
            
            // Set up real-time updates for viewer counts
            setupRealTimeViewerUpdates(unique);
        }
    } catch (e) {}
}

// Update live match count display
function updateLiveMatchCount(matches) {
    const liveMatches = matches.filter(match => match.status === 'live');
    const liveCount = liveMatches.length;
    
    // Update all live count elements
    document.querySelectorAll('#live-count').forEach(element => {
        element.textContent = liveCount;
    });
    
    // Update totalMatches if it exists
    const totalMatchesElement = document.querySelector('[data-match-count]');
    if (totalMatchesElement) {
        totalMatchesElement.textContent = matches.length;
    }
    
    console.log(`📊 Updated live match count: ${liveCount} live matches, ${matches.length} total matches`);
}

// Search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const matchCards = document.querySelectorAll('.match-card');
            
            matchCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            const matchCards = document.querySelectorAll('.match-card');
            
            matchCards.forEach(card => {
                if (filterValue === 'all') {
                    card.style.display = 'block';
                } else {
                    const status = card.querySelector('.status-indicator')?.textContent.toLowerCase();
                    card.style.display = status === filterValue ? 'block' : 'none';
                }
            });
        });
    }
}

// Initialize search and filter
document.addEventListener('DOMContentLoaded', function() {
    setupSearchAndFilter();
});

// Setup auto-refresh for sport pages
async function setupAutoRefresh(sport, containerId, noMatchesId) {
    try {
        console.log(`🔄 Setting up auto-refresh for ${sport}...`);
        console.log(`📊 Container ID: ${containerId}, No Matches ID: ${noMatchesId}`);
        
        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} not found!`);
            return;
        }
        console.log(`✅ Container ${containerId} found`);
        
        // Load initial matches
        await loadAndRenderSportMatches(sport, containerId, noMatchesId);
        
        // Set up auto-refresh every 2 minutes
        setInterval(async () => {
            if (!document.hidden) {
                console.log(`🔄 Auto-refreshing ${sport} matches...`);
                await loadAndRenderSportMatches(sport, containerId, noMatchesId);
            }
        }, 120000); // 2 minutes
        
    } catch (error) {
        console.error(`❌ Error setting up auto-refresh for ${sport}:`, error);
    }
}

// Load and render sport matches
async function loadAndRenderSportMatches(sport, containerId, noMatchesId) {
    try {
        console.log(`🔄 Loading ${sport} matches...`);
        
        const matches = await loadSportMatches(sport);
        console.log(`📊 Loaded ${matches.length} matches for ${sport}`);
        
        if (matches.length > 0) {
            console.log(`🎯 Rendering ${matches.length} matches in container ${containerId}`);
            renderMatchesWithSearch(matches, containerId, `Search ${sport} matches...`);
            // Hide no matches message
            const noMatchesEl = document.getElementById(noMatchesId);
            if (noMatchesEl) {
                noMatchesEl.classList.add('hidden');
                console.log(`✅ Hidden no-matches message`);
            }
        } else {
            console.log(`⚠️ No matches found, showing no-matches message`);
            // Show no matches message
            const noMatchesEl = document.getElementById(noMatchesId);
            if (noMatchesEl) {
                noMatchesEl.classList.remove('hidden');
                console.log(`✅ Showed no-matches message`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error loading ${sport} matches:`, error);
    }
}

// Real-time viewer count updates
let viewerEventSource = null;

function setupRealTimeViewerUpdates(slugs) {
    // Close existing connection if any
    if (viewerEventSource) {
        viewerEventSource.close();
    }
    
    if (!slugs || slugs.length === 0) return;
    
    try {
        // Create EventSource for real-time updates
        const slugsParam = slugs.slice(0, 50).join(','); // Limit to 50 slugs to avoid URL length issues
        viewerEventSource = new EventSource(`/api/viewers/bulk?slugs=${encodeURIComponent(slugsParam)}&stream=true`);
        
        viewerEventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && data.counts) {
                    // Update all viewer count elements
                    const viewerEls = document.querySelectorAll('.viewer-count[data-slug]');
                    viewerEls.forEach(el => {
                        const slug = el.getAttribute('data-slug');
                        if (slug && typeof data.counts[slug] === 'number') {
                            el.textContent = data.counts[slug];
                        }
                    });
                }
            } catch (e) {
                console.warn('Error parsing viewer count data:', e);
            }
        };
        
        viewerEventSource.onerror = function(event) {
            console.warn('Viewer count SSE connection error:', event);
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (viewerEventSource && viewerEventSource.readyState === EventSource.CLOSED) {
                    setupRealTimeViewerUpdates(slugs);
                }
            }, 5000);
        };
        
        console.log(`📡 Started real-time viewer updates for ${slugs.length} matches`);
        
    } catch (e) {
        console.warn('Failed to setup real-time viewer updates:', e);
    }
}

// Clean up EventSource when page unloads
window.addEventListener('beforeunload', function() {
    if (viewerEventSource) {
        viewerEventSource.close();
    }
});

// Export functions for global use
window.MatchOra = {
    loadSportMatches,
    loadLiveMatches,
    loadTodaysMatches,
    renderMatches,
    renderMatchesWithSearch,
    searchMatches,
    initializeSearch,
    getMatchStatus,
    setupAutoRefresh,
    loadAndRenderSportMatches,
    setupRealTimeViewerUpdates
};