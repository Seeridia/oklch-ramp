# 发布 OKRamp 到 npm

npm 包名为 `oklch-ramp`。自动发布由 `.github/workflows/publish.yml` 执行，使用 npm Trusted Publishing（OIDC），不需要 `NPM_TOKEN`。

## 工作流

- `ci.yml`：PR 和 `main` 推送运行检查、测试、演示站构建和 library 打包。
- `publish.yml`：发布 GitHub Release 时，检出该 Release 的标签，校验版本，运行上述检查，打包并发布 npm。
- 在 Actions 页面手动运行 `Publish to npm` 只做预检，不会发布。
- 正式版发布到 `latest`；包含 `-` 的预发布版本发布到 `next`，且 GitHub Release 必须勾选预发布。
- 标签必须精确匹配根 `package.json`，例如版本 `0.1.1` 对应 `v0.1.1`。

工作流通过官方 `voidzero-dev/setup-vp` 安装 Vite+ 0.3.0 和 Node.js 24，使用 `vp install` 安装依赖、`vp pack` 构建 library、`vp check` 检查、`vp test` 测试。先构建 library 再检查，确保全新检出时 workspace 包的类型声明已存在。底层包管理器仍为 pnpm 11.24.0，`vp pm pack` 转发 tarball 打包命令；`vp pack` 本身是 library 构建命令。npm 11.19.0 专门用于 OIDC 发布，npm 从临时目录发布生成的 tarball，避免项目 `devEngines.packageManager` 限制引发 `EBADDEVENGINES`。`prepack` 会自动构建，防止发布旧产物。

## 一次性设置

1. 将源码、锁文件和工作流提交并推送到 `Seeridia/oklch-ramp`。在 Actions 手动运行一次 `Publish to npm` 验证 Linux 环境。
2. 若 npm 尚无此包，先在本地登录 npm 并发布首个版本。账号需要满足 npm 的邮箱验证和双因素认证要求。

   ```bash
   cd /tmp
   npm login --registry=https://registry.npmjs.org/
   cd /Users/seeridia/Documents/色阶
   vp pack
   vp check
   vp test
   vp pm pack --out /tmp/oklch-ramp-initial.tgz
   cd /tmp
   npm publish ./oklch-ramp-initial.tgz --ignore-scripts --access public --registry=https://registry.npmjs.org/
   ```

3. 打开 npm 的 `oklch-ramp` 包设置，添加 GitHub Actions Trusted Publisher：

   | 字段                 | 值            |
   | -------------------- | ------------- |
   | Organization or user | `Seeridia`    |
   | Repository           | `oklch-ramp`  |
   | Workflow filename    | `publish.yml` |
   | Environment name     | 留空          |

   若页面提供 Allowed actions，允许直接 `npm publish`。工作流没有使用 GitHub Environment，文件名只填写 `publish.yml`，不要填写完整路径。字段大小写必须一致。

4. 后续版本通过 GitHub Release 发布。首次本地已发布 `0.1.0` 时，下次自动发布应使用新版本，例如 `0.1.1`，不要再次发布 `0.1.0`。

## 日常发版

1. 修改根 `package.json` 的版本，并更新 `CHANGELOG.md`。更新依赖时同步 `pnpm-lock.yaml`。
2. 提交并推送改动到 `main`，等待 CI 成功。
3. 在 GitHub Releases 创建新 Release，标签为 `v<版本>`，目标选择包含版本改动的提交，填写发布说明后发布。
4. 查看 Actions 中的 `Publish to npm`。成功后在 npm 核对：

   ```bash
   cd /tmp
   npm view oklch-ramp version --registry=https://registry.npmjs.org/
   npm view oklch-ramp dist-tags --registry=https://registry.npmjs.org/
   ```

例如 `0.2.0-beta.1` 对应标签 `v0.2.0-beta.1`，GitHub 勾选预发布，用户通过 `pnpm add oklch-ramp@next` 安装。

## 排错

- 认证失败：核对 npm Trusted Publisher 的仓库、文件名、Allowed actions；工作流需要 GitHub 托管 runner 和 `id-token: write` 权限。
- 版本已存在：npm 不允许覆盖同一版本。如果已成功发布，勿直接重跑发布步骤；有新改动时递增版本再发版。
- 标签或预发布状态不符：使 Release 标签、根包版本和 GitHub 预发布选项一致。
- 普通检查失败：修复后用新的发布提交和标签重试，确认最终发布源码可追溯。

参考：[npm Trusted Publishing 官方文档](https://docs.npmjs.com/trusted-publishers/)。
