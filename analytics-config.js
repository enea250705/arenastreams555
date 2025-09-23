// Google Analytics Configuration for ArenaStreams
// Replace 'GA_MEASUREMENT_ID' with your actual GA4 Measurement ID

const ANALYTICS_CONFIG = {
    // Your actual GA4 Measurement ID
    measurementId: 'G-TM2J2414Z9',
    
    // Custom events to track
    events: {
        // User interactions
        sportSelection: 'sport_selection',
        matchClick: 'match_click',
        streamPlay: 'stream_play',
        
        // Search functionality
        search: 'search',
        searchNavigation: 'search_navigation',
        searchUsage: 'search_usage',
        
        // Stream interactions
        serverSwitch: 'server_switch',
        streamError: 'stream_error',
        streamSuccess: 'stream_success'
    },
    
    // Event categories
    categories: {
        navigation: 'Navigation',
        matchInteraction: 'Match Interaction',
        streaming: 'Streaming',
        search: 'Search'
    }
};

// Helper function to get the measurement ID
function getMeasurementId() {
    return ANALYTICS_CONFIG.measurementId;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ANALYTICS_CONFIG;
}
