

# GitHub Release Version Checker & Bumper

This project automatically checks GitHub release versions and bumps the version number. It does not update the source code.

## Features
- Checks the latest release version of a specified repository
- Automatically bumps the version number (patch, minor, or major)
- Supports release names with prefixes and suffixes (e.g., `cuda_1.3.0`, `v1.0.0-beta`)
- Can be integrated into CI/CD workflows or GitHub Actions

## Usage

1. Configure the bump type (`patch`, `minor`, or `major`) as an input.
2. The repository owner and name are detected automatically from the workflow environment.
3. Optionally specify a prefix and/or suffix for release names.
4. Run the action to automatically check and bump the version.

#### Parameters

**bump-type**: Specifies which part of the version to increment. Use `'patch'`, `'minor'`, or `'major'` to bump the corresponding part of the version number.

- `patch`: Increments the last number (e.g. `1.2.3` → `1.2.4`)
- `minor`: Increments the middle number and resets the last (e.g. `1.2.3` → `1.3.0`)
- `major`: Increments the first number and resets the others (e.g. `1.2.3` → `2.0.0`)

##### Suffix (revision) bump examples:

- `patch`: `1.2.3dev` → `1.2.4dev1`, `1.2.3dev2` → `1.2.4dev3`
- `minor`: `1.2.3dev` → `1.3.0dev1`, `1.2.3dev2` → `1.3.0dev1`
- `major`: `1.2.3dev` → `2.0.0dev1`, `1.2.3dev2` → `2.0.0dev1`

**current-version**: Optionally specify the desired version to use. If this version does not exist in the repository's releases, it will be used directly. If it already exists, the action will bump it according to the bump-type. If `current-version` is not set and no releases exist, a sensible default will be used (`1.0.0` for major, `0.1.0` for minor, `0.0.1` for patch).

**prefix**: (Optional) A prefix string for the release name. For example, if your releases are named `cuda_1.3.0`, set `prefix: 'cuda_'`. The action will:
- Only consider releases that start with this prefix
- Extract the version ID by removing the prefix
- Create new releases with the prefix prepended to the version

**suffix**: (Optional) A suffix string for the release name. For example, if your releases are named `1.3.0-beta`, set `suffix: '-beta'`. The action will:
- Only consider releases that end with this suffix
- Extract the version ID by removing the suffix
- Create new releases with the suffix appended to the version

> **Note**: The `version` output always contains the pure version ID without prefix/suffix. For example, if the release name is `cuda_1.3.0`, the output will be `1.3.0`.

### Example: Using in a GitHub Actions Workflow

#### Basic Example

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
        uses: jianlins/check_bump_version@v2
        with:
          bump-type: 'patch' # or 'minor'/'major'
          current-version: '0.0.1' # optional, set your desired version
```

#### Example with Prefix/Suffix

For projects with multiple release tracks (e.g., CUDA versions), you can use prefix to distinguish them:

```yaml
name: Check and Bump CUDA Version
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
      - name: Check and bump CUDA version
        uses: jianlins/check_bump_version@v2
        with:
          bump-type: 'patch'
          prefix: 'cuda_'
          # This will look for releases like 'cuda_1.3.0' and create 'cuda_1.3.1'
```

For pre-release or beta versions:

```yaml
- name: Check and bump beta version
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'patch'
    suffix: '-beta'
    # This will look for releases like '1.3.0-beta' and create '1.3.1-beta'
```

Combining prefix and suffix:

```yaml
- name: Check and bump version
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'minor'
    prefix: 'v'
    suffix: '-rc'
    # This will look for releases like 'v1.3.0-rc' and create 'v1.4.0-rc'
```

#### Real-world Example with Release Creation

See the complete example in action: [test_bump repository workflow](https://github.com/jianlins/test_bump/blob/main/.github/workflows/bump-version.yml)

```yaml
name: Check and Bump Version

on:
  push:
    branches:
      - main

jobs:
  bump-version:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Check and bump version
        id: bump
        uses: jianlins/check_bump_version@v2
        with:
          bump-type: 'patch'
          current-version: '0.0.1'
      - name: Create release with bumped version
        id: create_release
        uses: ncipollo/release-action@v1
        with:
          tag: ${{ steps.bump.outputs.version }}
          name: ${{ steps.bump.outputs.version }}
          draft: false
          prerelease: false
      - name: Use bumped version
        run: echo "Bumped version is ${{ steps.bump.outputs.version }}"
```

#### Using the bumped version in your workflow

The bumped version is available as an output variable named `version`. You can reference it in subsequent steps using `${{ steps.<step_id>.outputs.version }}`. For example:

```yaml
- name: Check and bump version
  id: bump
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'patch'
    current-version: '0.0.1'

- name: Use bumped version
  run: echo "Bumped version is ${{ steps.bump.outputs.version }}"
```

> **Note**: When using `prefix` and/or `suffix`, the `version` output contains only the version ID (e.g., `1.3.1`), not the full release name (e.g., `cuda_1.3.1`). If you need the full release name with prefix/suffix, construct it yourself: `${{ inputs.prefix }}${{ steps.bump.outputs.version }}${{ inputs.suffix }}`

## Dependencies
- Node.js
- GitHub REST API

## Directory Structure
- `index.js` main script
- `package.json` dependency management
- `README.md` project description
- `TODO.md` task list
