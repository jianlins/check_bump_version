// index.js
const axios = require('axios');

/**
 * Get the latest release version of the specified repository
 * @param {string} owner Repository owner
 * @param {string} repo Repository name
 * @param {string} token GitHub Token (optional, increases API rate limit)
 * @returns {Promise<string>} Latest release version tag
 */
async function getLatestReleaseVersion(owner, repo, token = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const headers = token ? { Authorization: `token ${token}` } : {};
  const response = await axios.get(url, { headers });
  return response.data.tag_name;
}

/**
 * Bump version according to bump type
 * @param {string} version Current version (e.g. v1.2.3)
 * @param {'patch'|'minor'|'major'} bumpType Bump type
 * @returns {string} New version
 */
function bumpVersion(version, bumpType) {
  const v = version.startsWith('v') ? version.slice(1) : version;
  const parts = v.split('.').map(Number);
  if (bumpType === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return 'v' + parts.join('.');
}

/**
 * Automatically create a new tag and release
 * @param {string} owner Repository owner
 * @param {string} repo Repository name
 * @param {string} newVersion New version tag
 * @param {string} token GitHub Token
 */
async function createRelease(owner, repo, newVersion, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const headers = { Authorization: `token ${token}` };
  const data = {
    tag_name: newVersion,
    name: newVersion,
    body: `Auto bump to ${newVersion}`,
    draft: false,
    prerelease: false
  };
  const response = await axios.post(url, data, { headers });
  return response.data.html_url;
}

// Example usage
async function main() {
  const owner = process.env.GITHUB_OWNER || 'octocat';
  const repo = process.env.GITHUB_REPO || 'Hello-World';
  const bumpType = process.env.BUMP_TYPE || 'patch';
  const token = process.env.GITHUB_TOKEN || '';

  try {
    const latestVersion = await getLatestReleaseVersion(owner, repo, token);
    const newVersion = bumpVersion(latestVersion, bumpType);
    console.log(`Latest release version: ${latestVersion}`);
    console.log(`New bumped version: ${newVersion}`);

    if (token) {
      const releaseUrl = await createRelease(owner, repo, newVersion, token);
      console.log(`New release created: ${releaseUrl}`);
    } else {
      console.log('GitHub Token not provided, release not created automatically.');
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.error('Release not found, please make sure the repository has releases.');
    } else {
      console.error('Failed to get or create release:', err.message);
    }
  }
}

main();
