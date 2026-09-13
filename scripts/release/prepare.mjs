import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.RELEASE_SHA;
const branch = 'automation/release';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const output = (key, value) => appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`GitHub ${method} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function finalizePr(pr) {
  const labels = await api('labels?per_page=100');
  if (!labels.some((label) => label.name === 'release: automated')) {
    await api('labels', 'POST', {
      name: 'release: automated',
      color: '0052d9',
      description: 'Automated npm version PR',
    });
  }
  await api(`issues/${pr.number}/labels`, 'POST', { labels: ['release: automated'] });
  // GITHUB_TOKEN pushes do not trigger pull_request CI. Dispatch it explicitly.
  await api('actions/workflows/ci.yml/dispatches', 'POST', { ref: branch });
  console.log(pr.html_url);
}

output('publish', 'false');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.name !== '@okramp/core' || pkg.private || !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  throw new Error('Expected a public stable @okramp/core package.');
}
const associated = await api(`commits/${sha}/pulls?per_page=100`);
const releasePr = associated.find(
  (pr) =>
    pr.merged_at &&
    pr.merge_commit_sha === sha &&
    pr.base.ref === 'main' &&
    pr.head.ref === branch &&
    pr.head.repo?.full_name === repository &&
    pr.labels.some((label) => label.name === 'release: automated'),
);
if (releasePr) {
  const previous = JSON.parse(git('show', `${sha}^:package.json`));
  if (previous.version === pkg.version) throw new Error('Release PR did not change the version.');
  output('publish', 'true');
  output('version', pkg.version);
  console.log(`Release PR #${releasePr.number} merged: publish ${pkg.version}.`);
  process.exit(0);
}

if ((await api('branches/main')).commit.sha !== sha) {
  console.log('A newer main commit exists; its successful CI will handle the release.');
  process.exit(0);
}

const state = JSON.parse(readFileSync('.release-state.json', 'utf8'));
const metadata = new Set(['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md', '.release-state.json']);
const commits = git('log', '--no-merges', '--reverse', '--format=%H', `${state.baseSha}..${sha}`)
  .split('\n')
  .filter(Boolean)
  .flatMap((hash) => {
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', hash)
      .split('\n')
      .filter(Boolean);
    if (files.every((file) => metadata.has(file))) return [];
    return [
      {
        hash,
        subject: git('show', '-s', '--format=%s', hash),
        body: git('show', '-s', '--format=%B', hash),
      },
    ];
  });
if (commits.length === 0) {
  console.log('No changes requiring a release PR.');
  process.exit(0);
}
const owner = repository.split('/')[0];
const prs = await api(`pulls?state=open&base=main&head=${owner}:${branch}`);
const existing = prs[0];
if (existing) {
  const content = await api(`contents/.release-state.json?ref=${branch}`);
  const existingState = JSON.parse(Buffer.from(content.content, 'base64').toString());
  if (existingState.baseSha === sha) {
    console.log(`Release PR #${existing.number} already covers this commit.`);
    await finalizePr(existing);
    process.exit(0);
  }
}
const [major, minor, patch] = pkg.version.split('.').map(Number);
const breaking = commits.some(
  (commit) =>
    /^[\w-]+(?:\([^)]+\))?!:/.test(commit.subject) || /^BREAKING[ -]CHANGE:/m.test(commit.body),
);
const feature = commits.some((commit) => /^feat(?:\([^)]+\))?:/.test(commit.subject));
const version = breaking
  ? major === 0
    ? `0.${minor + 1}.0`
    : `${major + 1}.0.0`
  : feature
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;
const notes = commits
  .map(
    (commit) =>
      `- ${commit.subject} ([${commit.hash.slice(0, 7)}](https://github.com/${repository}/commit/${commit.hash}))`,
  )
  .join('\n');
git('checkout', '-B', branch, sha);
pkg.version = version;
writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync('.release-state.json', `${JSON.stringify({ baseSha: sha }, null, 2)}\n`);
const changelog = readFileSync('CHANGELOG.md', 'utf8');
writeFileSync(
  'CHANGELOG.md',
  changelog.replace('# Changelog', `# Changelog\n\n## ${version}\n\n${notes}`),
);
execFileSync('vp', ['fmt', 'package.json', '.release-state.json', 'CHANGELOG.md'], {
  stdio: 'inherit',
});
git('config', 'user.name', 'github-actions[bot]');
git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
git('add', 'package.json', '.release-state.json', 'CHANGELOG.md');
git('commit', '-m', `chore(release): ${version}`);
git('push', '--force-with-lease', 'origin', `HEAD:refs/heads/${branch}`);
const title = `chore(release): ${version}`;
const body = `This PR updates the package version and changelog for npm publication.\n\nMerge after CI passes. Successful main CI will publish @okramp/core@${version}; no GitHub Release is created.\n\n${notes}`;
const pr = existing
  ? await api(`pulls/${existing.number}`, 'PATCH', { title, body })
  : await api('pulls', 'POST', { title, body, head: branch, base: 'main' });
await finalizePr(pr);
