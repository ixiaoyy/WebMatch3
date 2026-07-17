# Frontend Toolchain Contract

## 1. Scope / Trigger

Apply this contract whenever a task changes:

- root or `apps/web` package scripts;
- workspace dependencies or `pnpm-lock.yaml`;
- Vite, TypeScript, ESLint, Vitest, or SCSS configuration;
- the development or preview server port;
- the `@` source alias or production output behavior.

The contract keeps every check runnable from the repository root and prevents
pnpm installation behavior from depending on an interactive local approval.

## 2. Signatures

The root `package.json` exposes these stable commands:

| Command | Delegated command | Required result |
|---|---|---|
| `pnpm dev:web` | `pnpm --dir apps/web dev` | Starts Vite on port 5175 |
| `pnpm lint:web` | `pnpm --dir apps/web lint` | ESLint exits with no warnings |
| `pnpm typecheck:web` | `pnpm --dir apps/web typecheck` | `vue-tsc` succeeds |
| `pnpm test:web` | `pnpm --dir apps/web test` | Vitest succeeds deterministically |
| `pnpm build:web` | `pnpm --dir apps/web build` | Writes a static `apps/web/dist` |
| `pnpm ci:web` | lint → typecheck → test → build | All stages succeed in order |

## 3. Contracts

- Runtime: Node.js 22 or newer.
- Package manager: `pnpm@11.1.1`, declared by the root `packageManager`.
- Workspace packages: only `apps/web` until a task explicitly introduces
  another deployable package.
- Install policy in `pnpm-workspace.yaml`:
  - `esbuild`: build script allowed because Vite requires its platform binary.
  - `@parcel/watcher`: build script denied because the optional native watcher
    is not required for the verified workflow.
- Vite development server: port 5175 with `strictPort: true`.
- Vite preview server: port 4175 with `strictPort: true`.
- Source alias: `@/*` maps to `apps/web/src/*` in both Vite and TypeScript.
- Tests: Node environment by default; an empty foundation may use
  `--passWithNoTests`, but feature tasks must add tests for implemented logic.
- No environment variables are required by the foundation.

## 4. Validation & Error Matrix

| Condition | Expected behavior |
|---|---|
| Lockfile differs from package manifests | `pnpm install --frozen-lockfile` fails |
| A dependency has an unreviewed install script | pnpm fails with `ERR_PNPM_IGNORED_BUILDS` |
| Port 5175 is already occupied | Vite exits instead of silently choosing another port |
| ESLint emits a warning | `pnpm lint:web` fails because `--max-warnings 0` is set |
| Vue or TypeScript types are invalid | `pnpm typecheck:web` fails before build |
| No test files exist during the foundation task | `pnpm test:web` exits successfully |
| A later feature has failing tests | `pnpm test:web` and `pnpm ci:web` fail |
| Production bundling fails | `pnpm build:web` and the final CI stage fail |

## 5. Good / Base / Bad Cases

- Good: a dependency change updates `apps/web/package.json`, regenerates the
  lockfile, passes frozen installation, and passes `pnpm ci:web`.
- Base: a source-only change leaves dependency files untouched and passes
  `pnpm ci:web`.
- Bad: a developer runs `pnpm approve-builds` interactively but does not
  commit an explicit `allowBuilds` policy; clean environments can then fail.
- Bad: a root script bypasses the Web package script and creates a second
  command definition with different flags.

## 6. Tests Required

After toolchain or dependency changes:

1. Run `pnpm install --frozen-lockfile`; assert exit code 0.
2. Run `pnpm ci:web`; assert lint, typecheck, test, and build all execute.
3. Start `pnpm dev:web`; assert `http://127.0.0.1:5175` returns HTTP 200 and
   contains the `#app` mount element, then stop the server.
4. Inspect direct dependencies with `pnpm --dir apps/web list --depth 0`;
   assert every runtime dependency has an implemented use case.

Feature tasks must replace the empty-suite allowance with relevant test files;
they must not rely on `--passWithNoTests` as evidence that behavior is tested.

## 7. Wrong vs Correct

### Wrong

```yaml
packages:
  - "apps/web"

allowBuilds:
  esbuild: set this to true or false
```

The generated placeholder is not an approval decision and causes installation
to remain non-reproducible.

### Correct

```yaml
packages:
  - "apps/web"

allowBuilds:
  "@parcel/watcher": false
  esbuild: true
```

This records the reviewed native-build policy in versioned workspace config.
