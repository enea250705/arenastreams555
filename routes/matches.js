const express = require('express');
const moment = require('moment');
const slugify = require('slugify');
const { getSupabaseClient } = require('../lib/supabase');

const router = express.Router();

async function loadMatches() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase loadMatches error:', error.message);
    return [];
  }
  return data || [];
}

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matchesData = await loadMatches();
    res.json({
      success: true,
      matches: matchesData,
      total: matchesData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET matches by sport
router.get('/sport/:sport', async (req, res) => {
  try {
    const matchesData = await loadMatches();
    const { sport } = req.params;
    const sportMatches = matchesData.filter(match => 
      match.sport.toLowerCase() === sport.toLowerCase()
    );
    
    res.json({
      success: true,
      sport,
      matches: sportMatches,
      total: sportMatches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET today's matches
router.get('/today', async (req, res) => {
  try {
    const matchesData = await loadMatches();
    const today = moment().format('YYYY-MM-DD');
    const todayMatches = matchesData.filter(match => 
      moment(match.date).format('YYYY-MM-DD') === today
    );
    
    res.json({
      success: true,
      date: today,
      matches: todayMatches,
      total: todayMatches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET specific match
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { data: match, error } = await supabase.from('matches').select('*').eq('id', id).single();
    
    if (error || !match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST new match
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      embedUrls = [],
      teamABadge = '',
      teamBBadge = ''
    } = req.body;
    
    // Validation
    if (!sport || !teamA || !teamB || !competition || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sport, teamA, teamB, competition, date'
      });
    }
    
    // Generate unique ID
    const id = `${sport}-${Date.now()}`;
    
    // Create match object
    const newMatch = {
      id,
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date,
      embedUrls: Array.isArray(embedUrls) ? embedUrls : [embedUrls],
      teamABadge,
      teamBBadge,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      source: 'manual'
    };
    
    // Persist to Supabase
    const insertPayload = {
      id,
      sport: newMatch.sport,
      teamA,
      teamB,
      competition,
      date,
      embed_urls: newMatch.embedUrls,
      teamABadge,
      teamBBadge,
      status: newMatch.status,
      slug,
      source: newMatch.source,
      created_at: newMatch.createdAt,
      updated_at: newMatch.createdAt
    };
    const { error: insErr } = await supabase.from('matches').insert([insertPayload]);
    if (insErr) throw new Error(insErr.message);
    
    // Generate SEO page
    const slug = slugify(`${teamA}-vs-${teamB}-live-${moment(date).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    newMatch.slug = slug;
    
    // Generate HTML page
    await generateMatchPage(newMatch);
    
    res.json({
      success: true,
      match: newMatch,
      message: 'Match added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT update match
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { data: existing, error } = await supabase.from('matches').select('*').eq('id', id).single();
    if (error || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const update = { ...req.body };
    if (Array.isArray(update.embedUrls)) {
      update.embed_urls = update.embedUrls;
      delete update.embedUrls;
    }
    update.updated_at = new Date().toISOString();
    const { error: upErr } = await supabase.from('matches').update(update).eq('id', id);
    if (upErr) throw new Error(upErr.message);
    const { data: updatedRow } = await supabase.from('matches').select('*').eq('id', id).single();
    // Regenerate SEO page
    await generateMatchPage(updatedRow);
    
    res.json({
      success: true,
      match: updatedRow,
      message: 'Match updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE match
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { data: existing, error } = await supabase.from('matches').select('slug').eq('id', id).single();
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    const { error: delErr } = await supabase.from('matches').delete().eq('id', id);
    if (delErr) throw new Error(delErr.message);
    
    // Delete generated page
    if (existing && existing.slug) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(`./generated/${existing.slug}.html`);
      } catch (error) {
        console.log('Could not delete generated page:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate match page function
async function generateMatchPage(match) {
  try {
    const slug = match.slug || slugify(`${match.teamA}-vs-${match.teamB}-live-${moment(match.date).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    match.slug = slug;
    
    // Read template
    const templatePath = path.join(__dirname, '..', 'views', 'match.html');
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace(/\{\{match\.teamA\}\}/g, match.teamA);
    template = template.replace(/\{\{match\.teamB\}\}/g, match.teamB);
    template = template.replace(/\{\{match\.competition\}\}/g, match.competition);
    template = template.replace(/\{\{match\.date\}\}/g, moment(match.date).format('MMMM DD, YYYY'));
    template = template.replace(/\{\{match\.slug\}\}/g, slug);
    
    // Save generated page
    await fs.writeFile(`./generated/${slug}.html`, template);
    
    console.log(`Generated match page: ${slug}.html`);
  } catch (error) {
    console.error('Error generating match page:', error);
  }
}

module.exports = router;
