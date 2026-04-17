#!/usr/bin/env node
/**
 * GitHub Data Sync Script
 * 
 * Fetches GitHub data for all repos and caches in Firestore.
 * Run manually: node scripts/sync-github.js
 * 
 * This eliminates runtime GitHub API calls and rate limit issues.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const https = require('https');
const path = require('path');

// Load repos from frontend
const repos = require(path.join(__dirname, '../frontend/repos.json'));

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN not set. Using unauthenticated requests (60/hour limit).');
}

/**
 * Make a GitHub API request
 */
function githubFetch(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'ProofOfShip-Sync',
        'Accept': 'application/vnd.github.v3+json',
        ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          resolve(null); // Not found is not an error
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch all data for a single repo
 */
async function fetchRepoData(owner, repo) {
  const [meta, commits, contributors] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}`),
    githubFetch(`/repos/${owner}/${repo}/stats/commit_activity`),
    githubFetch(`/repos/${owner}/${repo}/contributors?per_page=10`),
  ]);

  if (!meta) {
    return null;
  }

  // Get recent commits (last 30)
  const recentCommits = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=30`);

  return {
    meta: {
      name: meta.name,
      fullName: meta.full_name,
      description: meta.description,
      stars: meta.stargazers_count,
      forks: meta.forks_count,
      watchers: meta.watchers_count,
      openIssues: meta.open_issues_count,
      language: meta.language,
      topics: meta.topics || [],
      createdAt: meta.created_at,
      updatedAt: meta.updated_at,
      pushedAt: meta.pushed_at,
      defaultBranch: meta.default_branch,
      homepage: meta.homepage,
      license: meta.license?.spdx_id || null,
    },
    commits: Array.isArray(recentCommits) ? recentCommits.slice(0, 30).map(c => ({
      sha: c.sha,
      message: c.commit?.message?.split('\n')[0]?.slice(0, 100) || '',
      author: c.commit?.author?.name || c.author?.login || 'Unknown',
      date: c.commit?.author?.date || null,
      avatar: c.author?.avatar_url || null,
    })) : [],
    stats: {
      totalCommitsLast52Weeks: Array.isArray(commits) 
        ? commits.reduce((sum, week) => sum + (week.total || 0), 0) 
        : 0,
      weeklyActivity: Array.isArray(commits) 
        ? commits.slice(-12).map(w => ({ week: w.week, total: w.total }))
        : [],
      contributorCount: Array.isArray(contributors) ? contributors.length : 0,
      topContributors: Array.isArray(contributors) 
        ? contributors.slice(0, 5).map(c => ({
            login: c.login,
            avatar: c.avatar_url,
            contributions: c.contributions,
          }))
        : [],
    },
  };
}

/**
 * Sync a single repo to Firestore
 */
async function syncRepo(repoConfig) {
  const { slug, owner, repo } = repoConfig;
  const cacheKey = `${owner}_${repo}`;
  
  console.log(`  Syncing ${owner}/${repo}...`);
  
  try {
    const data = await fetchRepoData(owner, repo);
    
    if (!data) {
      console.log(`    ⚠️  Not found, skipping`);
      return { slug, status: 'not_found' };
    }

    await db.collection('github_cache').doc(cacheKey).set({
      ...data,
      slug,
      owner,
      repo,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      syncedBy: 'manual',
    });

    console.log(`    ✓ Synced (${data.meta.stars}★, ${data.commits.length} commits)`);
    return { slug, status: 'synced', stars: data.meta.stars };
    
  } catch (error) {
    console.error(`    ✗ Error: ${error.message}`);
    return { slug, status: 'error', error: error.message };
  }
}

/**
 * Main sync function
 */
async function syncAll() {
  console.log(`\n🔄 Syncing ${repos.length} repositories to Firestore...\n`);
  
  const results = [];
  
  // Process sequentially to respect rate limits
  for (const repo of repos) {
    const result = await syncRepo(repo);
    results.push(result);
    
    // Small delay to be nice to GitHub API
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  const synced = results.filter(r => r.status === 'synced').length;
  const errors = results.filter(r => r.status === 'error').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✓ Synced: ${synced}`);
  console.log(`   ⚠️  Not found: ${notFound}`);
  console.log(`   ✗ Errors: ${errors}`);
  
  if (errors > 0) {
    console.log(`\n❌ Failed repos:`);
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.slug}: ${r.error}`);
    });
  }

  console.log(`\n✅ Sync complete. Data cached in Firestore 'github_cache' collection.\n`);
}

// Run
syncAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
