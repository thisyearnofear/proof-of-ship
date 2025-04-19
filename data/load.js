const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');
dotenv.config();

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
console.log(GITHUB_TOKEN);

const repos = require(path.join(__dirname, '../repos.json'));

async function getGithubData(endpoint, owner, repoName) {
  const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repoName}/${endpoint}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  return response.data;
}

async function getGithubDataWithPagination(owner, repoName, endpoint) {
  let page = 1;
  let allData = [];
  
  console.log(chalk.blue(`🔄 Starting pagination for ${chalk.bold(owner+'/'+repoName+'/'+endpoint)}`));
  
  while (true) {
    try {
      const response = await axios.get(
        `${GITHUB_API_URL}/repos/${owner}/${repoName}/${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&per_page=100`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (response.data.length === 0) {
        console.log(chalk.green(`✅ Completed fetching all pages for ${chalk.bold(owner+'/'+repoName+'/'+endpoint)}`));
        break;
      }
      
      allData = [...allData, ...response.data];
      console.log(chalk.cyan(`📥 Fetched page ${chalk.bold(page)} with ${chalk.bold(response.data.length)} items`));
      page++;
    } catch (error) {
      console.error(chalk.red(`❌ Error fetching page ${page}: ${error.message}`));
      throw error;
    }
  }
  
  return allData;
}

async function saveJsonToFile(data, filename) {
    const dirPath = path.join(__dirname, '../public/data/github-data');
    const filePath = path.join(dirPath, filename);
  
    // Create the directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });
  
    // Write the JSON data to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Fetch weekly commit activity for last year
async function getCommitActivity(owner, repoName) {
  console.log(chalk.blue(`🚂 Fetching commit activity for ${chalk.bold(owner+'/'+repoName)}`));
  // Poll for stats (up to 12 attempts, 5s delay)
  for (let attempt = 1; attempt <= 12; attempt++) {
    const response = await axios.get(
      `${GITHUB_API_URL}/repos/${owner}/${repoName}/stats/commit_activity`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    console.log(chalk.yellow(`Stats not ready for ${owner}/${repoName} (attempt ${attempt}), retrying in 5s...`));
    await new Promise(res => setTimeout(res, 5000));
  }
  console.log(chalk.yellow(`Polling exhausted for ${owner}/${repoName}, attempting contributors fallback...`));
  // Contributors-stats fallback
  try {
    const contribResp = await axios.get(
      `${GITHUB_API_URL}/repos/${owner}/${repoName}/stats/contributors`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (contribResp.status === 200 && Array.isArray(contribResp.data) && contribResp.data.length > 0) {
      const weeksData = contribResp.data[0].weeks;
      const aggregated = weeksData.map((wk, idx) => {
        const total = contribResp.data.reduce((sum, c) => sum + (c.weeks[idx]?.c || 0), 0);
        return { week: wk.w, total };
      });
      console.log(chalk.green(`Using contributors fallback for ${owner}/${repoName}`));
      return aggregated;
    }
  } catch (err) {
    console.log(chalk.red(`Contributors fallback error for ${owner}/${repoName}: ${err.message}`));
  }
  console.log(chalk.red(`Failed all fallbacks for ${owner}/${repoName}, returning empty array.`));
  return [];
}

async function loadAllGithubData() {
  try {
    console.log(chalk.yellow('\n📊 Starting GitHub Data Collection'));
    
    for (const { slug, owner, repo: repoName } of repos) {
      console.log(chalk.yellow(`\n📊 Processing ${owner}/${repoName} (${slug})`));

      console.log(chalk.magenta('\n📌 Fetching issues...'));
      const issues = await getGithubDataWithPagination(owner, repoName, 'issues?state=all');
      await saveJsonToFile(issues, `${slug}-issues.json`);
      console.log(chalk.green(`✅ Saved ${issues.length} issues to data/github-data/${slug}-issues.json`));

      console.log(chalk.magenta('\n🔄 Fetching pull requests...'));
      const prs = await getGithubDataWithPagination(owner, repoName, 'pulls?state=all');
      await saveJsonToFile(prs, `${slug}-prs.json`);
      console.log(chalk.green(`✅ Saved ${prs.length} PRs to data/github-data/${slug}-prs.json`));

      console.log(chalk.magenta('\n🏷️  Fetching releases...'));
      const releases = await getGithubDataWithPagination(owner, repoName, 'releases');
      await saveJsonToFile(releases, `${slug}-releases.json`);
      console.log(chalk.green(`✅ Saved ${releases.length} releases to data/github-data/${slug}-releases.json`));

      // Commit activity
      try {
        console.log(chalk.magenta('\n🚂 Fetching commit activity...'));
        const commits = await getCommitActivity(owner, repoName);
        await saveJsonToFile(Array.isArray(commits) ? commits : [], `${slug}-commits.json`);
        console.log(chalk.green(`✅ Saved commit activity to data/github-data/${slug}-commits.json`));
      } catch (err) {
        console.error(chalk.red(`❌ Error fetching commit activity for ${slug}: ${err.message}`));
      }

      const meta = { updatedAt: new Date().toISOString() };
      await saveJsonToFile(meta, `${slug}-meta.json`);
      console.log(chalk.green(`✅ Saved metadata to data/github-data/${slug}-meta.json`));
    }

    console.log(chalk.green.bold('\n✨ All GitHub data loaded and saved successfully! ✨'));
  } catch (error) {
    console.error(chalk.red.bold(`\n❌ Error loading GitHub data: ${error.message}`));
    throw error;
  }
}

loadAllGithubData();