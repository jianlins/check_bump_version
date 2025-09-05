# GitHub Release Version Checker & Bumper

本项目用于自动检查 GitHub release 版本，并自动进行版本号提升（bump），不涉及源码更新。

## 功能
- 检查指定仓库的最新 release 版本
- 自动提升版本号（如 patch/minor/major）
- 可集成到 CI/CD 流程或 GitHub Actions

## 使用方法
1. 配置仓库信息和版本提升类型
2. 运行脚本自动完成版本检查与提升

## 依赖
- Node.js
- GitHub REST API

## 目录结构
- `index.js` 主脚本
- `package.json` 依赖管理
- `README.md` 项目说明
- `TODO.md` 任务清单
