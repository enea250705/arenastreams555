const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const multer = require('multer');
const slugify = require('slugify');
const moment = require('moment');
const { getSupabaseClient } = require('../lib/supabase');
const { loadMatches, addMatch, updateMatch, deleteMatch, getMatchById } = require('../lib/json-storage');

const router = express.Router();

// Register Handlebars helpers for math operations
handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

handlebars.registerHelper('divide', function(a, b) {
  return b !== 0 ? a / b : 0;
});

handlebars.registerHelper('round', function(a) {
  return Math.round(a);
});

handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

// Load matches from JSON storage
async function loadMatchesFromStorage() {
  try {
    return loadMatches();
  } catch (error) {
    console.error('JSON storage loadMatches error:', error.message);
    return [];
  }
}

// Overrides (extra servers for fetched matches) via Supabase
async function upsertOverride(slug, urls) {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('overrides')
      .upsert({ slug, embed_urls: urls, updated_at: now }, { onConflict: 'slug' });
    if (error) throw error;
  } catch (e) {
    console.error('Supabase upsert override failed:', e.message);
    throw e;
  }
}

// Multer memory storage + Supabase Storage upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadLogoToSupabase(file, keyPrefix) {
  if (!file) return '';
  try {
    const supabase = getSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'logos';
    const ext = (file.originalname && file.originalname.split('.').pop()) || 'png';
    const objectPath = `${keyPrefix}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file.buffer, { contentType: file.mimetype || 'image/png', upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return (data && data.publicUrl) || '';
  } catch (e) {
    console.error('Logo upload failed:', e.message);
    return '';
  }
}

// Template rendering function
async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '..', 'views', `${templateName}.html`);
    const templateSource = await fs.readFile(templatePath, 'utf8');
    
    // Compile Handlebars template
    const template = handlebars.compile(templateSource);
    
    // Register helpers
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    // Render template with data
    return template(data);
  } catch (error) {
    console.error('Error rendering template:', error);
    throw error;
  }
}

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    const matchesData = await loadMatchesFromStorage();
    
    // Fetch AdBlock statistics
    let adblockStats = {
      totalVisits: 0,
      adblockVisits: 0,
      cleanVisits: 0,
      adblockPercentage: 0,
      cleanPercentage: 0,
      dailyStats: {}
    };
    
    try {
      // Use relative URL to work in both development and production
      const baseUrl = req.protocol + '://' + req.get('host');
      const response = await fetch(`${baseUrl}/api/admin/adblock-stats`);
      if (response.ok) {
        adblockStats = await response.json();
      }
    } catch (error) {
      console.error('Error fetching AdBlock stats:', error);
    }
    
    const stats = {
      totalMatches: matchesData.length,
      matchesBySport: {},
      todayMatches: 0,
      upcomingMatches: 0,
      adblock: adblockStats
    };
    
    const today = new Date().toISOString().split('T')[0];
    
    matchesData.forEach(match => {
      // Count by sport
      if (!stats.matchesBySport[match.sport]) {
        stats.matchesBySport[match.sport] = 0;
      }
      stats.matchesBySport[match.sport]++;
      
      // Count today's matches
      if (match.date && match.date.startsWith(today)) {
        stats.todayMatches++;
      }
      
      // Count upcoming matches
      if (match.status === 'upcoming') {
        stats.upcomingMatches++;
      }
    });
    
    const html = await renderTemplate('admin', {
      stats,
      recentMatches: matchesData.slice(-10).reverse()
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

// Add match form
router.get('/add-match', async (req, res) => {
  try {
    const html = await renderTemplate('add-match', {
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc', 'american-football']
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading add match form:', error);
    res.status(500).send('Error loading add match form');
  }
});

// Add extra server for fetched matches (by slug)
router.get('/add-server', async (req, res) => {
  try {
    const { slug = '' } = req.query || {};
    const html = await renderTemplate('add-server', { slug, error: null });
    res.send(html);
  } catch (error) {
    console.error('Error loading add server form:', error);
    res.status(500).send('Error loading add server form');
  }
});

router.post('/add-server', async (req, res) => {
  try {
    const { slug, embedUrls } = req.body;

    if (!slug || !embedUrls) {
      const html = await renderTemplate('add-server', {
        slug,
        error: 'Please provide both the match slug and at least one embed URL'
      });
      return res.send(html);
    }

    const urls = embedUrls.split('\n').map(u => u.trim()).filter(Boolean);
    await upsertOverride(slug, urls);

    res.redirect('/admin?success=Server links saved for match');
  } catch (error) {
    console.error('Error saving server override:', error);
    const html = await renderTemplate('add-server', {
      slug: req.body.slug,
      error: 'Error saving: ' + error.message
    });
    res.send(html);
  }
});

// Handle add match form submission
router.post('/add-match', upload.fields([{ name: 'teamALogo' }, { name: 'teamBLogo' }]), async (req, res) => {
  try {
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      time,
      embedUrls,
      teamABadge,
      teamBBadge
    } = req.body;
    
    // Validation
    if (!sport || !teamA || !teamB || !competition || !date) {
      const html = await renderTemplate('add-match', {
        sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc', 'american-football'],
        error: 'Please fill in all required fields',
        formData: req.body
      });
      return res.send(html);
    }
    
    // Combine date and time
    const fullDate = time ? `${date}T${time}` : date;
    
    // Generate unique ID
    const id = `${sport}-${Date.now()}`;
    
    // Determine logo URLs if files uploaded (Supabase Storage)
    const teamALogoFile = req.files && req.files.teamALogo && req.files.teamALogo[0];
    const teamBLogoFile = req.files && req.files.teamBLogo && req.files.teamBLogo[0];
    const uploadedTeamALogo = await uploadLogoToSupabase(teamALogoFile, 'teamA');
    const uploadedTeamBLogo = await uploadLogoToSupabase(teamBLogoFile, 'teamB');

    // Create match object
    const newMatch = {
      id,
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date: fullDate,
      embedUrls: embedUrls ? embedUrls.split('\n').filter(url => url.trim()) : [],
      teamABadge: uploadedTeamALogo || teamABadge,
      teamBBadge: uploadedTeamBLogo || teamBBadge,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    source: 'admin'
    };
    
    // Generate SEO-friendly slug
    newMatch.slug = slugify(`${teamA}-vs-${teamB}-live-${moment(fullDate).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    // Persist to JSON storage
    try {
      const success = addMatch(newMatch);
      if (!success) {
        throw new Error('Failed to save match to storage');
      }
      console.log('✅ Match added to JSON storage:', newMatch.id);
    } catch (storageError) {
      console.error('Storage error:', storageError.message);
      throw new Error('Failed to save match: ' + storageError.message);
    }
    
    res.redirect('/admin?success=Match added successfully');
  } catch (error) {
    console.error('Error adding match:', error);
    const html = await renderTemplate('add-match', {
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc', 'american-football'],
      error: 'Error adding match: ' + error.message,
      formData: req.body
    });
    res.send(html);
  }
});

// Edit match form
router.get('/edit-match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    const { data: match, error } = await supabase.from('matches').select('*').eq('id', id).single();
    if (error) return res.status(404).send('Match not found');
    
    if (!match) {
      return res.status(404).send('Match not found');
    }
    
    const html = await renderTemplate('edit-match', {
      match,
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc']
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading edit match form:', error);
    res.status(500).send('Error loading edit match form');
  }
});

// Handle edit match form submission
router.post('/edit-match/:id', upload.fields([{ name: 'teamALogo' }, { name: 'teamBLogo' }]), async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    const { data: existing, error: exErr } = await supabase.from('matches').select('*').eq('id', id).single();
    if (exErr || !existing) return res.status(404).send('Match not found');
    
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      time,
      embedUrls,
      teamABadge,
      teamBBadge,
      status
    } = req.body;
    
    // Update match
    const fullDate = time ? `${date}T${time}` : date;
    
    const uploadedTeamALogoE = await uploadLogoToSupabase(req.files && req.files.teamALogo && req.files.teamALogo[0], 'teamA');
    const uploadedTeamBLogoE = await uploadLogoToSupabase(req.files && req.files.teamBLogo && req.files.teamBLogo[0], 'teamB');

    const updated = {
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date: fullDate,
      embed_urls: embedUrls ? embedUrls.split('\n').filter(url => url.trim()) : [],
      teamABadge: uploadedTeamALogoE || teamABadge || existing.teamABadge,
      teamBBadge: uploadedTeamBLogoE || teamBBadge || existing.teamBBadge,
      status: status || 'upcoming',
      slug: slugify(`${teamA}-vs-${teamB}-live-${moment(fullDate).format('YYYY-MM-DD')}`, { lower: true, strict: true }),
      updated_at: new Date().toISOString()
    };
    const { error: upErr } = await supabase.from('matches').update(updated).eq('id', id);
    if (upErr) throw new Error(upErr.message);
    
    res.redirect('/admin?success=Match updated successfully');
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).send('Error updating match');
  }
});

// Delete match
router.post('/delete-match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    const { data: matchRow, error } = await supabase.from('matches').select('slug').eq('id', id).single();
    if (error) return res.status(404).send('Match not found');
    const { error: delErr } = await supabase.from('matches').delete().eq('id', id);
    if (delErr) throw new Error(delErr.message);
    
    // Delete generated page
    if (matchRow && matchRow.slug) {
      try {
        await fs.unlink(`./generated/${matchRow.slug}.html`);
      } catch (error) {
        console.log('Could not delete generated page:', error.message);
      }
    }
    
    res.redirect('/admin?success=Match deleted successfully');
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).send('Error deleting match');
  }
});

// Regenerate all match pages
router.post('/regenerate-pages', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: matchesData, error } = await supabase.from('matches').select('*');
    if (error) throw new Error(error.message);

    let regenerated = 0;
    
    for (const match of matchesData) {
      try {
        // Generate slug if not exists
        if (!match.slug) {
          const slugify = require('slugify');
          const moment = require('moment');
          match.slug = slugify(`${match.teamA}-vs-${match.teamB}-live-${moment(match.date).format('YYYY-MM-DD')}`, {
            lower: true,
            strict: true
          });
        }
        
        // Read template
        const templatePath = path.join(__dirname, '..', 'views', 'match.html');
        let template = await fs.readFile(templatePath, 'utf8');
        
        // Replace placeholders
        template = template.replace(/\{\{match\.teamA\}\}/g, match.teamA);
        template = template.replace(/\{\{match\.teamB\}\}/g, match.teamB);
        template = template.replace(/\{\{match\.competition\}\}/g, match.competition);
        template = template.replace(/\{\{match\.date\}\}/g, require('moment')(match.date).format('MMMM DD, YYYY'));
        template = template.replace(/\{\{match\.slug\}\}/g, match.slug);
        
        // Save generated page
        await fs.writeFile(`./generated/${match.slug}.html`, template);
        regenerated++;
      } catch (error) {
        console.error(`Error regenerating page for match ${match.id}:`, error);
      }
    }
    
    // Save updated matches with slugs
    await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
    
    res.redirect(`/admin?success=${regenerated} match pages regenerated successfully`);
  } catch (error) {
    console.error('Error regenerating pages:', error);
    res.status(500).send('Error regenerating pages');
  }
});

module.exports = router;
