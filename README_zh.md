# GitHub Release Version Checker & Bumper

本项目可自动检查 GitHub release 版本并提升版本号，不涉及源码更新。

## 功能
- 检查指定仓库的最新 release 版本
- 自动提升版本号（如 patch/minor/major）
- 支持带前缀和后缀的 release 名称（如 `cuda_1.3.0`、`v1.0.0-beta`）
- 可集成到 CI/CD 流程或 GitHub Actions

## 使用方法

1. 配置版本提升类型（`patch`、`minor` 或 `major`）作为输入参数。
2. 仓库 owner 和 name 会自动从 workflow 环境中检测，无需手动配置。
3. 可选配置 release 名称的前缀和/或后缀。
4. 运行 Action 自动完成版本检查与提升。

#### 参数说明

**bump-type**：指定要提升的版本部分。可选值为 'patch'、'minor' 或 'major'，分别对应补丁号、小版本号和主版本号。

- `patch`：增加最后一位数字（如 1.2.3 → 1.2.4）
- `minor`：增加中间位数字并将最后一位归零（如 1.2.3 → 1.3.0）
- `major`：增加第一位数字并将后两位归零（如 1.2.3 → 2.0.0）

##### 修订号（后缀）示例：

- `patch`：1.2.3dev → 1.2.4dev1，1.2.3dev2 → 1.2.4dev3
- `minor`：1.2.3dev → 1.3.0dev1，1.2.3dev2 → 1.3.0dev1
- `major`：1.2.3dev → 2.0.0dev1，1.2.3dev2 → 2.0.0dev1

**current-version**：可选参数，指定要使用的版本号。如果该版本在仓库的 releases 中不存在，则直接使用该版本。如果已存在，则根据 bump-type 进行提升。如果未设置 `current-version` 且仓库无任何 releases，则使用合理的默认值（major 使用 `1.0.0`，minor 使用 `0.1.0`，patch 使用 `0.0.1`）。

**prefix**：（可选）release 名称的前缀字符串。例如，如果你的 release 命名为 `cuda_1.3.0`，设置 `prefix: 'cuda_'`。Action 将会：
- 只考虑以该前缀开头的 release
- 通过移除前缀来提取版本号
- 创建新 release 时自动添加前缀

**suffix**：（可选）release 名称的后缀字符串。例如，如果你的 release 命名为 `1.3.0-beta`，设置 `suffix: '-beta'`。Action 将会：
- 只考虑以该后缀结尾的 release
- 通过移除后缀来提取版本号
- 创建新 release 时自动添加后缀

> **注意**：`version` 输出始终只包含纯版本号，不含前缀/后缀。例如，如果 release 名称为 `cuda_1.3.0`，输出将是 `1.3.0`。

### 示例：在 GitHub Actions 工作流中使用

#### 基础示例

```yaml
name: 检查并提升版本
on:
  push:
    branches:
      - main
jobs:
  bump-version:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v3
      - name: 检查并提升版本
        uses: jianlins/check_bump_version@v2
        with:
          bump-type: 'patch' # 或 'minor'/'major'
          current-version: '0.0.1' # 可选，指定你希望的版本号
```

#### 使用前缀/后缀的示例

对于有多个发布轨道的项目（如 CUDA 版本），可以使用前缀来区分：

```yaml
name: 检查并提升 CUDA 版本
on:
  push:
    branches:
      - main
jobs:
  bump-version:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v3
      - name: 检查并提升 CUDA 版本
        uses: jianlins/check_bump_version@v2
        with:
          bump-type: 'patch'
          prefix: 'cuda_'
          # 这将查找类似 'cuda_1.3.0' 的 release 并创建 'cuda_1.3.1'
```

对于预发布或测试版本：

```yaml
- name: 检查并提升 beta 版本
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'patch'
    suffix: '-beta'
    # 这将查找类似 '1.3.0-beta' 的 release 并创建 '1.3.1-beta'
```

同时使用前缀和后缀：

```yaml
- name: 检查并提升版本
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'minor'
    prefix: 'v'
    suffix: '-rc'
    # 这将查找类似 'v1.3.0-rc' 的 release 并创建 'v1.4.0-rc'
```

#### 包含发布创建的实际示例

查看完整实际示例：[test_bump 仓库工作流](https://github.com/jianlins/test_bump/blob/main/.github/workflows/bump-version.yml)

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

#### 在工作流中使用生成的版本号

生成的版本号会作为输出变量 `version` 提供。你可以在后续步骤中通过 `${{ steps.<step_id>.outputs.version }}` 引用。例如：

```yaml
- name: 检查并提升版本
  id: bump
  uses: jianlins/check_bump_version@v2
  with:
    bump-type: 'patch'
    current-version: '0.0.1'

- name: 使用生成的版本号
  run: echo "生成的版本号是 ${{ steps.bump.outputs.version }}"
```

> **注意**：使用 `prefix` 和/或 `suffix` 时，`version` 输出只包含版本号（如 `1.3.1`），不包含完整的 release 名称（如 `cuda_1.3.1`）。如果需要完整的 release 名称，请自行拼接：`${{ inputs.prefix }}${{ steps.bump.outputs.version }}${{ inputs.suffix }}`

## 依赖
- Node.js
- GitHub REST API

## 目录结构
- `index.js` 主脚本
- `package.json` 依赖管理
- `README.md` 项目说明
- `TODO.md` 任务清单
