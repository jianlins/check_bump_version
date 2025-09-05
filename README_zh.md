# GitHub Release Version Checker & Bumper

本项目可自动检查 GitHub release 版本并提升版本号，不涉及源码更新。

## 功能
- 检查指定仓库的最新 release 版本
- 自动提升版本号（如 patch/minor/major）
- 可集成到 CI/CD 流程或 GitHub Actions

## 使用方法

1. 配置版本提升类型（`patch`、`minor` 或 `major`）作为输入参数。
2. 仓库 owner 和 name 会自动从 workflow 环境中检测，无需手动配置。
3. 运行 Action 自动完成版本检查与提升。

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
        uses: jianlins/check_bump_version@v1
        with:
          bump-type: 'patch' # 或 'minor'/'major'
          current-version: '0.0.1' # 可选，指定你希望的版本号
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

#### 在工作流中使用生成的版本号

生成的版本号会作为输出变量 `version` 提供。你可以在后续步骤中通过 `${{ steps.<step_id>.outputs.version }}` 引用。例如：

```yaml
- name: 检查并提升版本
  id: bump
  uses: jianlins/check_bump_version@v1
  with:
    bump-type: 'patch'
    current-version: '0.0.1'

- name: 使用生成的版本号
  run: echo "生成的版本号是 ${{ steps.bump.outputs.version }}"
```

## 依赖
- Node.js
- GitHub REST API

## 目录结构
- `index.js` 主脚本
- `package.json` 依赖管理
- `README.md` 项目说明
- `TODO.md` 任务清单
