

# GitHub Release Version Checker & Bumper

This project automatically checks GitHub release versions and bumps the version number. It does not update the source code.

## Features
- Checks the latest release version of a specified repository
- Automatically bumps the version number (patch, minor, or major)
- Can be integrated into CI/CD workflows or GitHub Actions

## Usage
#### Parameters


**bump-type**: Specifies which part of the version to increment. Use `'patch'`, `'minor'`, or `'major'` to bump the corresponding part of the version number. For example, a patch bump changes `1.2.3` to `1.2.4`, a minor bump changes `1.2.3` to `1.3.0`, and a major bump changes `1.2.3` to `2.0.0`.


**current-version**: Optionally specify the desired version to use. If this version does not exist in the repository's releases, it will be used directly. If it already exists, the action will bump it according to the bump-type. If `current-version` is not set and no releases exist, a sensible default will be used (`1.0.0` for major, `0.1.0` for minor, `0.0.1` for patch).
1. Configure the bump type (`patch`, `minor`, or `major`) as an input.
2. The repository owner and name are detected automatically from the workflow environment.
3. Run the action to automatically check and bump the version.

### Example: Using in a GitHub Actions Workflow

```yaml
name: Check and Bump Version
on:
  push:
    branches:
      - main
jobs:
  bump-version:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Check and bump version
        uses: jianlins/check_bump_version@v1
        with:
          bump-type: 'patch' # or 'minor'/'major'
          current-version: '0.0.1' # optional, set your desired version
```


#### About `bump-type`

- `patch`: Increments the last number (e.g. `1.2.3` → `1.2.4`)
- `minor`: Increments the middle number and resets the last (e.g. `1.2.3` → `1.3.0`)
- `major`: Increments the first number and resets the others (e.g. `1.2.3` → `2.0.0`)

##### Suffix (revision) bump examples:

- `patch`: `1.2.3dev` → `1.2.4dev1`, `1.2.3dev2` → `1.2.4dev3`
- `minor`: `1.2.3dev` → `1.3.0dev1`, `1.2.3dev2` → `1.3.0dev1`
- `major`: `1.2.3dev` → `2.0.0dev1`, `1.2.3dev2` → `2.0.0dev1`

## Dependencies
- Node.js
- GitHub REST API

## Directory Structure
- `index.js` main script
- `package.json` dependency management
- `README.md` project description
- `TODO.md` task list
