// index.js
const https = require('https');

/**
 * Make HTTP request using Node.js built-in https module
 * @param {string} url URL to request
 * @param {object} options Request options
 * @returns {Promise<any>} Response data
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'GitHub-Release-Version-Bumper',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

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
  const response = await makeRequest(url, { headers });
  return response.tag_name;
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
  const response = await makeRequest(url, { headers });
  return response.map(r => r.tag_name);
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
  const headers = { 
    Authorization: `token ${token}`,
    'Content-Type': 'application/json'
  };
  const data = {
    tag_name: newVersion,
    name: newVersion,
    body: `Auto bump to ${newVersion}`,
    draft: false,
    prerelease: false
  };
  const response = await makeRequest(url, { method: 'POST', headers, data });
  return response.html_url;
}

/**
 * Extract version ID from a release tag by removing prefix and suffix
 * @param {string} tag Release tag (e.g., "cuda_1.3.0-beta")
 * @param {string} prefix Prefix to remove (e.g., "cuda_")
 * @param {string} suffix Suffix to remove (e.g., "-beta")
 * @returns {string|null} Version ID or null if tag doesn't match pattern
 */
function extractVersionFromTag(tag, prefix, suffix) {
  if (prefix && !tag.startsWith(prefix)) {
    return null;
  }
  if (suffix && !tag.endsWith(suffix)) {
    return null;
  }
  let version = tag;
  if (prefix) {
    version = version.slice(prefix.length);
  }
  if (suffix) {
    version = version.slice(0, -suffix.length);
  }
  return version;
}

/**
 * Construct full release name from version ID with prefix and suffix
 * @param {string} version Version ID (e.g., "1.3.0")
 * @param {string} prefix Prefix to add (e.g., "cuda_")
 * @param {string} suffix Suffix to add (e.g., "-beta")
 * @returns {string} Full release name (e.g., "cuda_1.3.0-beta")
 */
function constructReleaseName(version, prefix, suffix) {
  return `${prefix}${version}${suffix}`;
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
  // Get prefix and suffix parameters
  const prefix = process.env.PREFIX || process.env['INPUT_PREFIX'] || '';
  const suffix = process.env.SUFFIX || process.env['INPUT_SUFFIX'] || '';

  try {
    let chosenVersion;
    let allTags = [];
    let noRelease = false;
    try {
      allTags = await getAllReleaseTags(owner, repo, token);
    } catch (err) {
      if (err.message && err.message.includes('404')) {
        noRelease = true;
        allTags = [];
      } else {
        throw err;
      }
    }

    // Extract version IDs from tags that match the prefix/suffix pattern
    const matchingVersions = allTags
      .map(tag => ({ tag, version: extractVersionFromTag(tag, prefix, suffix) }))
      .filter(item => item.version !== null);

    if (setVersion) {
      // Check if the full release name (prefix + setVersion + suffix) exists
      const fullSetVersionName = constructReleaseName(setVersion, prefix, suffix);
      const existingMatch = matchingVersions.find(item => item.version === setVersion);
      
      if (!existingMatch) {
        chosenVersion = setVersion;
        console.log(`SET_VERSION ${setVersion} (release name: ${fullSetVersionName}) not found in releases, using it.`);
      } else {
        // bump from setVersion
        chosenVersion = bumpVersion(setVersion, bumpType);
        console.log(`SET_VERSION ${setVersion} already exists as ${existingMatch.tag}, bumped to ${chosenVersion}.`);
      }
    } else if (noRelease || matchingVersions.length === 0) {
      // No releases exist (or none match the prefix/suffix pattern), use sensible default
      if (bumpType === 'major') {
        chosenVersion = '1.0.0';
      } else if (bumpType === 'minor') {
        chosenVersion = '0.1.0';
      } else {
        chosenVersion = '0.0.1';
      }
      if (prefix || suffix) {
        console.log(`No releases found matching pattern "${prefix}<version>${suffix}", using default version: ${chosenVersion}`);
      } else {
        console.log(`No releases found, using default version: ${chosenVersion}`);
      }
    } else {
      // Find the latest release that matches the prefix/suffix pattern
      // The first matching tag from getAllReleaseTags should be the latest (API returns in order)
      const latestMatch = matchingVersions[0];
      const latestVersion = latestMatch.version;
      chosenVersion = bumpVersion(latestVersion, bumpType);
      console.log(`Latest matching release: ${latestMatch.tag} (version: ${latestVersion})`);
      console.log(`New bumped version: ${chosenVersion}`);
    }

    // Keep bumping until we find a version that doesn't exist
    let fullReleaseName = constructReleaseName(chosenVersion, prefix, suffix);
    const existingTags = new Set(allTags);
    
    while (existingTags.has(fullReleaseName)) {
      console.log(`Version ${chosenVersion} (release name: ${fullReleaseName}) already exists, bumping again...`);
      chosenVersion = bumpVersion(chosenVersion, bumpType);
      fullReleaseName = constructReleaseName(chosenVersion, prefix, suffix);
    }
    
    console.log(`Final version: ${chosenVersion} (release name: ${fullReleaseName})`);

    // Output the chosen version for GitHub Actions (output the version ID, not the full release name)
    if (process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${chosenVersion}\n`);
    } else {
      // fallback: print to stdout
      console.log(`::set-output name=version::${chosenVersion}`);
    }

    if (token) {
      const releaseUrl = await createRelease(owner, repo, fullReleaseName, token);
      console.log(`New release created: ${releaseUrl}`);
      if (prefix || suffix) {
        console.log(`Release name: ${fullReleaseName}, Version ID: ${chosenVersion}`);
      }
    } else {
      console.log('GitHub Token not provided, release not created automatically.');
      if (prefix || suffix) {
        console.log(`Would create release: ${fullReleaseName}, Version ID: ${chosenVersion}`);
      }
    }
  } catch (err) {
    console.error('Failed to get or create release:', err.message);
  }
}

main();
