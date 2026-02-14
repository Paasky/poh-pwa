# Pages of History

## 1. Installation

### 1.1 Required files

Install Dropbox

```bash
wget https://www.dropbox.com/download?plat=lnx.x86_64 -O dropbox.tar.gz
tar -xzf dropbox.tar.gz

# Run dropbox to login
~/.dropbox-dist/dropboxd

# Stop & verify:
Ctrl+C
ls ~/Dropbox

# Create symlink & verify
ln -s ~/Dropbox/poh/media /path/to/poh-pwa/public/media
ls -l /path/to/poh-pwa/public/media

# Expected output:
media -> /home/YOUR USER NAME/Dropbox/poh/media

# Verify Dropbox is running (auto-sync active, do this after a system reboot)
pgrep -a dropbox
```

### 1.2 Docker

Quickstart: `bash scripts/poh.sh`

> Toggles between up/down. If Dev isn’t running, starts it and prints the local URL.
>
> May need `chmod +x scripts/poh.sh` to execute
>
> Use either Docker or Local, not both

### 1.3 Local

- `pnpm install`
- `pnpm dev` then open http://localhost:5173
- For a different port, run: `pnpm dev -- --port 3000`

---

## 2. `./scripts/poh.sh` Docker helper

We ship Dockerfiles and a tiny manager script.

It has a selection menu (default is always toggle up/down).

Defaults:

- Dev: port 5173 (fallback 5174)
- Prod: port 8080 (fallback 8081)

### 2.1 Menu options

#### Lint + output required fixes — use this to quickly prep a commit

`bash scripts/poh.sh prep` (runs `fix && check` inside Docker)

#### Dev Up

`bash scripts/poh.sh dev-up` (hot reload; tries 5173 then 5174)

Auto-install: Dev Up automatically runs `pnpm install` inside the container so branch switches and lockfile changes are
handled without extra steps.

#### Dev Down

`bash scripts/poh.sh dev-down`

#### Prod Up

`bash scripts/poh.sh prod-up` (nginx; tries 8080 then 8081)

#### Prod Down

`bash scripts/poh.sh prod-down`

#### Rebuild Images

`bash scripts/poh.sh rebuild` (run this after package.json updates)

#### Status

`bash scripts/poh.sh status`

#### Format + lint autofix

`bash scripts/poh.sh fix` (runs `pnpm fix` inside Docker)

#### Full pre-commit checks

`bash scripts/poh.sh check` (runs `pnpm precommit:all` inside Docker)

#### Custom port

`bash scripts/poh.sh dev-up 3000` or
`bash scripts/poh.sh prod-up 9090` or
`POH_PORT=3000`.

#### LAN mode (test on real devices)

- Use `--lan` (or env `POH_LAN=1`) to publish on all interfaces instead of only localhost:
    - `bash scripts/poh.sh dev-up --lan`
    - Then open from another device: `http://<your-lan-ip>:5173/`
- HMR over LAN: usually works out of the box. If you see HMR connection issues, set
  `VITE_HMR_HOST=<your-lan-ip>` before starting Dev Up. Example:
    - `VITE_HMR_HOST=192.168.1.50 bash scripts/poh.sh dev-up --lan`
- macOS: if prompted, allow Docker Desktop to accept incoming connections (System Settings → Network → Firewall).

#### Notes

- Uses an isolated Docker network `poh-pwa-net`, unique image/container names.
- Dev mounts your working directory for instant reload; node_modules is masked inside the container (no files written to
  your host).
- Fix/Check/Prep run inside Docker (no local Node/pnpm needed).
- Dev Up automatically installs deps in the container when needed, so you generally do NOT need to rebuild images after
  changing `package.json` or `pnpm-lock.yaml`. Use `rebuild` only if the base dev image itself changes (e.g., Node
  version, global tools).

## 3. Development

This repo enforces comprehensive quality gates on every commit using Husky pre-commit hooks. On commit, the following
will run and the commit will be blocked on any error or warning:

- Prettier format check (no auto-fix) — ensures consistent formatting
- ESLint with TypeScript and Vue rules — warnings are treated as errors
- Type checking via vue-tsc
- Unit tests via Vitest (non-watch, full run)
- Vite development build — build warnings are treated as errors

Manual run:

- `pnpm precommit:all`

Fixing common issues quickly:

- `pnpm fix` — runs Prettier and ESLint auto-fixes across the repo

Notes:

- Hooks are installed automatically on `pnpm install` via the `prepare` script. If hooks are not running, execute
  `pnpm prepare`.
- To fix lint/format issues automatically, just run: `pnpm fix`.
- Skipping hooks with `git commit -n` is discouraged; CI should reflect the same checks.
- Linting ignores configuration/build scripts and tests by default (e.g., _.config._, vite.config._, tailwind/postcss
  config files, scripts/**, tests/**, **tests**/\*\*, _.spec._, _.test.\*). These files often intentionally deviate from
  app code rules.

What runs under the hood (see package.json scripts):

- `format:check` → `prettier -c .`
- `lint` → `eslint . --max-warnings 0`
- `typecheck` → `vue-tsc --noEmit -p tsconfig.json`
- `test` → `vitest run`
- `build:dev` → `vite build --mode development` with `FAIL_ON_WARNINGS=1` to fail on any Rollup/Vite warning

## 4. Deployment

- Build and push the production image to a registry:
    - `docker build -t USER/poh-pwa:test . && docker push USER/poh-pwa:test`
    - On server:
      `docker pull USER/poh-pwa:test && docker run -d --name poh-pwa-test -p 80:80 --restart=always USER/poh-pwa:test`
    - Promote to prod with tag `USER/poh-pwa:prod`.

CI idea (later): GitHub Actions builds `:test` on main, `:prod` on release tags.
