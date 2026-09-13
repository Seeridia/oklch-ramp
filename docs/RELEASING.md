# 发布 OKRamp 到 npm

发布全部通过 CI 和版本 PR 完成，不创建 GitHub Release。

## 日常流程

1. 将代码合并或推送到 `main`，等待 `CI` 成功。
2. `publish.yml` 自动创建或更新 `automation/release` 分支上的版本 PR，修改根 `package.json`、`CHANGELOG.md` 和 `.release-state.json`。
3. 审阅版本号与日志，等待版本 PR 的 CI 通过，再合并。推荐使用 squash merge，并保留 `release: automated` 标签及原分支名。
4. 合并提交的 main CI 成功后，`publish.yml` 识别版本 PR，检出该提交重新验证、打包并发布到 npm `latest`。

版本 PR 不会自动合并。普通 main 提交只准备 PR，不直接发布 npm。当前 workspace 使用 `workspace:*` 引用核心包，版本修改不需要改动锁文件；私有 playground 的版本独立于 npm 包。README 不硬编码最新版本。

## 版本与日志

- `feat:` / `feat(scope):` 升 minor。
- `fix:` 以及其他普通提交升 patch。
- `type!:` 或提交正文中的 `BREAKING CHANGE:` 升 major；0.x 阶段升 minor。
- 版本 PR 汇总上次基线之后的提交标题与链接。请使用准确的提交标题。
- `.release-state.json` 的 `baseSha` 记录已纳入版本 PR 的 main 提交。仅变更版本、锁文件、Changelog 和该状态文件的提交不再触发下一轮 PR，避免循环。
- 当前自动流程仅发布稳定版本；不要手动将版本改成预发布字符串。

## GitHub 与 npm 配置

仓库 Actions 设置需允许 GitHub Actions 创建 PR。工作流按 job 授予写入分支、PR、标签和手动触发 CI 的权限，发布 job 仅有读取源码及 `id-token: write`。

机器人使用 `GITHUB_TOKEN` 创建的 PR 不会自动触发普通 PR CI，因此流程会显式 dispatch `ci.yml` 到版本分支。主分支发版仍只接受成功的 push CI，不接受 PR 或手动 CI 作为 npm 发布触发。

为新 npm 包 `@okramp/core` 单独配置 Trusted Publisher（旧包的授权不会自动迁移）：

| 字段                 | 值            |
| -------------------- | ------------- |
| Organization or user | `Seeridia`    |
| Repository           | `okramp`      |
| Workflow filename    | `publish.yml` |
| Environment name     | 留空          |

使用 Vite+ 0.3.0、Node.js 24 和 npm OIDC 发布，无需 NPM_TOKEN。npm CLI 从临时目录发布 tarball，避免 workspace 的包管理器限制。

## 失败与重试

- CI 失败：修复对应提交；尚未通过检查时不会创建版本 PR 或发布。
- 创建 PR 失败：检查 Actions 创建 PR 的仓库权限，然后重跑失败的 `Publish to npm`。
- npm 发布失败：修复授权或网络问题后重跑失败的 workflow；无需创建 Release。
- 已存在的 npm 版本会跳过发布，避免覆盖。npm 接受上传后可能需要几分钟才能在 registry 查询到。
- 若 main 已前进，旧 CI 不再更新版本 PR；版本 PR 合并提交的发布仍使用其经过 CI 的确切 SHA。

参考：[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。

## 独立适配包

`@okramp/tdesign` 位于 `packages/tdesign`，独立版本发布。当前自动版本 PR 与 npm 发布流程只发布核心 `@okramp/core`；CI 同时打包适配包以验证 workspace 依赖。首次发布新包后，需在 npm 为新名称配置 Trusted Publisher。
