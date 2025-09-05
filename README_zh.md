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
# GitHub Release Version Checker & Bumper

本项目可自动检查 GitHub release 版本并提升版本号，不涉及源码更新。

## 功能
- 检查指定仓库的最新 release 版本
- 自动提升版本号（如 patch/minor/major）
- 可集成到 CI/CD 流程或 GitHub Actions

## 使用方法
#### 参数说明

**bump-type**：指定要提升的版本部分。可选值为 'patch'、'minor' 或 'major'，分别对应补丁号、小版本号和主版本号。例如，patch 提升会将 1.2.3 变为 1.2.4，minor 提升会将 1.2.3 变为 1.3.0，major 提升会将 1.2.3 变为 2.0.0。
1. 配置版本提升类型（`patch`、`minor` 或 `major`）作为输入参数。
2. 仓库 owner 和 name 会自动从 workflow 环境中检测，无需手动配置。
3. 运行 Action 自动完成版本检查与提升。
2. 仓库 owner 和 name 会自动从 workflow 环境中检测，无需手动配置
3. 运行 Action 自动完成版本检查与提升
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
					bump-type: 'patch' # 或 'minor'/'major'
```

#### 关于 `bump-type`

- `patch`：增加最后一位数字（如 1.2.3 → 1.2.4）
- `minor`：增加中间位数字并将最后一位归零（如 1.2.3 → 1.3.0）
- `major`：增加第一位数字并将后两位归零（如 1.2.3 → 2.0.0）

##### 修订号（后缀）示例：

- `patch`：1.2.3dev → 1.2.4dev1，1.2.3dev2 → 1.2.4dev3
- `minor`：1.2.3dev → 1.3.0dev1，1.2.3dev2 → 1.3.0dev1
- `major`：1.2.3dev → 2.0.0dev1，1.2.3dev2 → 2.0.0dev1

## 依赖
- Node.js
- GitHub REST API

## 目录结构
- `index.js` 主脚本
- `package.json` 依赖管理
- `README.md` 项目说明
- `TODO.md` 任务清单
