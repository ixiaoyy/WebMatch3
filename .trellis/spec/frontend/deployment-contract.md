# WebMatch3 Production Deployment Contract

## 1. Scope

This contract applies to GitHub Actions, production packaging, SSH upload,
release activation, container replacement, rollback, and public verification.

## 2. Trigger and build

- `.github/workflows/deploy-production.yml` is the only automatic production
  entry point.
- A push to `main` deploys automatically. `workflow_dispatch` provides an
  explicit retry path for an already committed revision.
- The workflow uses one non-cancelling `webmatch3-production` concurrency
  group so two releases cannot replace the container at the same time.
- The runner must use Node.js 22, pnpm 11.1.1, a frozen lockfile, and
  `pnpm ci:web` before packaging.
- Every archive contains `release.txt` with the full Git commit SHA. The same
  marker is verified inside the candidate container, on the production port,
  and through the public HTTPS URL.

## 3. GitHub production environment

The `production` environment owns these variables:

| Variable | Purpose |
| --- | --- |
| `DEPLOY_HOST` | SSH host |
| `DEPLOY_PORT` | SSH port |
| `DEPLOY_USER` | SSH account |
| `PRODUCTION_URL` | Public verification origin |

It also owns two encrypted secrets:

| Secret | Purpose |
| --- | --- |
| `DEPLOY_SSH_KEY` | Dedicated private deployment key |
| `DEPLOY_KNOWN_HOSTS` | Pinned SSH host-key line |

Do not place a password, private key, or unverified `ssh-keyscan` result in the
workflow file or repository. Rotate the deployment key in both GitHub and the
server's `authorized_keys` when access changes.

## 4. Server layout and activation

- Immutable releases live at `/opt/webmatch3/releases/<full-sha>`.
- Incoming archives live temporarily under `/opt/webmatch3/incoming`.
- `webmatch3-candidate-<short-sha>` mounts the release with no external Docker
  network and must serve `index.html` before production changes.
- The production container is named `webmatch3`, publishes host port `8088`,
  joins `parallellines_default` so the reverse proxy can resolve it, and uses
  `restart=unless-stopped`.
- The previously active container is retained as stopped
  `webmatch3-rollback`. A failed start or health check renames and restarts it
  automatically.
- `/opt/webmatch3/current` is updated only after the new container serves the
  expected full SHA.

## 5. Failure behavior

| Failure | Required result |
| --- | --- |
| Lint, type, test, or build failure | no SSH connection and no server change |
| Unknown SSH host key | deployment stops before upload |
| Required Docker network is absent | current container remains untouched |
| Invalid archive or release marker | current container remains untouched |
| Candidate health failure | current container remains untouched |
| Production start or health failure | previous container is restored |
| Public HTTPS marker mismatch | workflow fails visibly; server-side rollback remains available |

## 6. Verification

After changing the workflow or deployment script:

1. parse the workflow as YAML;
2. run `bash -n .github/scripts/deploy-webmatch3.sh`;
3. run `pnpm ci:web` when the build contract changed;
4. trigger one production deployment and confirm the Actions run succeeds;
5. confirm `/release.txt` equals the deployed full commit SHA and the public
   page returns HTTP 200 without redirecting to another product.
