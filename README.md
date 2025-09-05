

# GitHub Release Version Checker & Bumper

This project automatically checks GitHub release versions and bumps the version number. It does not update the source code.

## Features
- Checks the latest release version of a specified repository
- Automatically bumps the version number (patch, minor, or major)
- Can be integrated into CI/CD workflows or GitHub Actions

## Usage

1. Configure the bump type (`patch`, `minor`, or `major`) as an input.
2. The repository owner and name are detected automatically from the workflow environment.
3. Run the action to automatically check and bump the version.

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
        uses: jianlins/check_bump_version@v1
        with:
          bump-type: 'patch' # or 'minor'/'major'
          current-version: '0.0.1' # optional, set your desired version
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
        uses: jianlins/check_bump_version@v1
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
  uses: jianlins/check_bump_version@v1
  with:
    bump-type: 'patch'
    current-version: '0.0.1'

- name: Use bumped version
  run: echo "Bumped version is ${{ steps.bump.outputs.version }}"
```

## Dependencies
- Node.js
- GitHub REST API

## Directory Structure
- `index.js` main script
- `package.json` dependency management
- `README.md` project description
- `TODO.md` task list
