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
 * Get all release tags for the specified repository
 * @param {string} owner Repository owner
 * @param {string} repo Repository name
 * @param {string} token GitHub Token (optional)
 * @returns {Promise<string[]>} Array of release tags
 */
async function getAllReleaseTags(owner, repo, token = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const headers = token ? { Authorization: `token ${token}` } : {};
  const response = await axios.get(url, { headers });
  return response.data.map(r => r.tag_name);
}

/**
 * Bump version according to bump type
 * @param {string} version Current version (e.g. v1.2.3)
 * @param {'patch'|'minor'|'major'} bumpType Bump type
 * @returns {string} New version
 */
function bumpVersion(version, bumpType) {
  const v = version.startsWith('v') ? version.slice(1) : version;
  // Match main version and optional suffix
  const match = v.match(/^(\d+)\.(\d+)\.(\d+)([a-zA-Z]+\d*)?$/);
  if (!match) return v; // fallback: return as is
  let [_, major, minor, patch, suffix] = match;
  major = Number(major);
  minor = Number(minor);
  patch = Number(patch);
  // bump main version
  let newSuffix = '';
  if (bumpType === 'major') {
    major++;
    minor = 0;
    patch = 0;
    // always reset suffix to 1 for major bump
    if (suffix) {
      const suffixMatch = suffix.match(/^([a-zA-Z]+)(\d*)$/);
      if (suffixMatch) {
        const [__, letters] = suffixMatch;
        newSuffix = letters + '1';
      } else {
        newSuffix = suffix;
      }
    }
  } else if (bumpType === 'minor') {
    minor++;
    patch = 0;
    // always reset suffix to 1 for minor bump
    if (suffix) {
      const suffixMatch = suffix.match(/^([a-zA-Z]+)(\d*)$/);
      if (suffixMatch) {
        const [__, letters] = suffixMatch;
        newSuffix = letters + '1';
      } else {
        newSuffix = suffix;
      }
    }
  } else {
    patch++;
    // increment suffix for patch bump
    if (suffix) {
      const suffixMatch = suffix.match(/^([a-zA-Z]+)(\d*)$/);
      if (suffixMatch) {
        const [__, letters, digits] = suffixMatch;
        if (digits) {
          newSuffix = letters + (Number(digits) + 1);
        } else {
          newSuffix = letters + '1';
        }
      } else {
        newSuffix = suffix;
      }
    }
  }
  return `${major}.${minor}.${patch}${newSuffix}`;
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
  let owner = process.env.GITHUB_OWNER;
  let repo = process.env.GITHUB_REPO;
  if (process.env.GITHUB_REPOSITORY) {
    const [detectedOwner, detectedRepo] = process.env.GITHUB_REPOSITORY.split('/');
    owner = owner || detectedOwner;
    repo = repo || detectedRepo;
  }
  owner = owner || 'octocat';
  repo = repo || 'Hello-World';
  const bumpType = process.env.BUMP_TYPE || process.env['INPUT_BUMP-TYPE'] || 'patch';
  const token = process.env.GITHUB_TOKEN || '';
  // Support both SET_VERSION and INPUT_CURRENT-VERSION (from workflow input)
  const setVersion = process.env.SET_VERSION || process.env['INPUT_CURRENT-VERSION'];

  try {
    let chosenVersion;
    let allTags = [];
    let noRelease = false;
    try {
      allTags = await getAllReleaseTags(owner, repo, token);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        noRelease = true;
        allTags = [];
      } else {
        throw err;
      }
    }
    if (setVersion) {
      if (!allTags.includes(setVersion)) {
        chosenVersion = setVersion;
        console.log(`SET_VERSION ${setVersion} not found in releases, using it.`);
      } else {
        // bump from setVersion
        chosenVersion = bumpVersion(setVersion, bumpType);
        console.log(`SET_VERSION ${setVersion} already exists, bumped to ${chosenVersion}.`);
      }
    } else if (noRelease || allTags.length === 0) {
      // No releases exist, use sensible default
      if (bumpType === 'major') {
        chosenVersion = '1.0.0';
      } else if (bumpType === 'minor') {
        chosenVersion = '0.1.0';
      } else {
        chosenVersion = '0.0.1';
      }
      console.log(`No releases found, using default version: ${chosenVersion}`);
    } else {
      // fallback to latest release
      const latestVersion = await getLatestReleaseVersion(owner, repo, token);
      chosenVersion = bumpVersion(latestVersion, bumpType);
      console.log(`Latest release version: ${latestVersion}`);
      console.log(`New bumped version: ${chosenVersion}`);
    }

    // Output the chosen version for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${chosenVersion}\n`);
    } else {
      // fallback: print to stdout
      console.log(`::set-output name=version::${chosenVersion}`);
    }

    if (token) {
      const releaseUrl = await createRelease(owner, repo, chosenVersion, token);
      console.log(`New release created: ${releaseUrl}`);
    } else {
      console.log('GitHub Token not provided, release not created automatically.');
    }
  } catch (err) {
    console.error('Failed to get or create release:', err.message);
  }
}

main();
