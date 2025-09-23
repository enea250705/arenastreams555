const fs = require('fs');
const path = require('path');

// Use process.cwd() for better compatibility with Vercel
const DATA_DIR = path.join(process.cwd(), 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error.message);
  }
}

// Initialize matches file if it doesn't exist
function ensureMatchesFile() {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(MATCHES_FILE)) {
      fs.writeFileSync(MATCHES_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing matches file:', error.message);
  }
}

// Initialize on module load
ensureMatchesFile();

// In-memory fallback for Vercel (which has read-only file system)
let inMemoryMatches = [];

function loadMatches() {
  try {
    const data = fs.readFileSync(MATCHES_FILE, 'utf8');
    const matches = JSON.parse(data);
    // Sync in-memory storage
    inMemoryMatches = matches;
    return matches;
  } catch (error) {
    console.error('Error loading matches from file, using in-memory storage:', error.message);
    return inMemoryMatches;
  }
}

function saveMatches(matches) {
  try {
    ensureMatchesFile(); // Ensure directory and file exist
    fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
    // Also update in-memory storage
    inMemoryMatches = matches;
    console.log(`✅ Saved ${matches.length} matches to JSON storage`);
    return true;
  } catch (error) {
    console.error('Error saving matches to file, using in-memory storage:', error.message);
    // Fallback to in-memory storage
    inMemoryMatches = matches;
    console.log(`⚠️ Using in-memory storage for ${matches.length} matches`);
    return true; // Return true since we saved to memory
  }
}

function addMatch(newMatch) {
  try {
    console.log('🔄 Adding match to JSON storage:', newMatch.id);
    const matches = loadMatches();
    matches.push(newMatch);
    const success = saveMatches(matches);
    if (success) {
      console.log('✅ Match added successfully:', newMatch.id);
    }
    return success;
  } catch (error) {
    console.error('Error in addMatch:', error.message);
    return false;
  }
}

function updateMatch(id, updatedMatch) {
  const matches = loadMatches();
  const index = matches.findIndex(match => match.id === id);
  if (index !== -1) {
    matches[index] = { ...matches[index], ...updatedMatch };
    return saveMatches(matches);
  }
  return false;
}

function deleteMatch(id) {
  const matches = loadMatches();
  const filteredMatches = matches.filter(match => match.id !== id);
  return saveMatches(filteredMatches);
}

function getMatchById(id) {
  const matches = loadMatches();
  return matches.find(match => match.id === id);
}

function getMatchBySlug(slug) {
  const matches = loadMatches();
  return matches.find(match => match.slug === slug);
}

module.exports = {
  loadMatches,
  saveMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  getMatchById,
  getMatchBySlug
};
