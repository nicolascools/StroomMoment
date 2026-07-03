# StroomMoment Deployment

## Purpose

Deploy the StroomMoment public PoC to Proxmox at `https://poc.coolsnet.com` with a simple, reproducible Docker Compose workflow.

## Scope

- Public PoC hosting for `poc.coolsnet.com`.
- FastAPI backend, Next.js frontend, and a small Compose Caddy router.
- Persistent backend file cache.
- Manual update and rollback procedure.

## Chosen Proxmox Target

Target: Debian LXC named `stroommoment-01`.

Planned values:

| Item | Value |
| --- | --- |
| Hostname | `stroommoment-01` |
| IP address | `192.168.1.47` |
| Public hostname | `poc.coolsnet.com` |
| App root | `/opt/stroommoment` |
| Persistent cache | `/var/lib/stroommoment/cache` |
| Compose file | `/opt/stroommoment/apps/stroommoment/docker-compose.yml` |
| Internal app port | `8080` |

The public edge remains `edge-01`. It proxies `poc.coolsnet.com` to `192.168.1.47:8080`.

## Old `poc.coolsnet.com` Replacement Notes

`poc.coolsnet.com` previously hosted a static wall-screen PoC from `web-01:/srv/www/poc.coolsnet.com`.

Replacement model:

- `web-01` no longer serves the public `poc.coolsnet.com` application.
- old static files under `/srv/www/poc.coolsnet.com` can be archived or removed after validation.
- `edge-01` should route `poc.coolsnet.com` directly to `stroommoment-01:8080`.
- AdGuard split DNS should keep resolving `poc.coolsnet.com` to `edge-01` at `192.168.1.23`.
- public DNS should continue pointing `poc.coolsnet.com` at the WAN/edge path.

## Required Packages On The LXC

Install on `stroommoment-01`:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git qemu-guest-agent
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker nicolas
sudo systemctl enable --now docker qemu-guest-agent
```

Log out and back in after adding `nicolas` to the `docker` group, or use `sudo docker` for the first session.

## Git Remote Workflow

The source-of-truth remote is GitHub:

```text
https://github.com/nicolascools/StroomMoment
```

Local Windows development should push to `origin/master`:

```powershell
cd C:\Projects\StroomMoment
git status
git add .
git commit -m "Describe the change"
git push
```

The deployment host should pull from the same remote and rebuild the Compose stack:

```bash
cd /opt/stroommoment
git status
git pull --ff-only
docker compose -f apps/stroommoment/docker-compose.yml up -d --build
```

### One-Time Deployment Host Remote Setup

If `/opt/stroommoment` still points at `bundle-origin`, replace it with the GitHub remote.

If the GitHub repository is private, create a read-only GitHub deploy key from `stroommoment-01` first:

```bash
ssh-keygen -t ed25519 -C "stroommoment-01 StroomMoment deploy key"
cat ~/.ssh/id_ed25519.pub
```

Add the printed public key to the GitHub repository deploy keys, then configure the repo:

```bash
cd /opt/stroommoment
git status
git rev-parse HEAD
git remote remove bundle-origin || true
git remote add origin git@github.com:nicolascools/StroomMoment.git
git fetch origin
git branch --set-upstream-to=origin/master master
git pull --ff-only
git status
git remote -v
git branch -vv
```

If the GitHub repository is public and no deploy key is desired, HTTPS read-only pull can be used instead:

```bash
git remote add origin https://github.com/nicolascools/StroomMoment.git
```

If `/opt/stroommoment` reports that it is ahead of `bundle-origin`, that means the host was cloned or updated from a temporary Git bundle and then received local commits that do not exist on a durable shared remote. Once the GitHub remote is configured and `git pull --ff-only` is clean, `bundle-origin` can be removed and manual bundle transfer should stop being the normal workflow.

### Emergency Manual Bundle Fallback

Use bundles only if GitHub or SSH deploy keys are unavailable.

Temporary manual copy example from Windows:

```powershell
cd C:\Projects\StroomMoment
scp C:\Users\$env:USERNAME\AppData\Local\Temp\stroommoment.bundle nicolas@192.168.1.47:/tmp/stroommoment.bundle
ssh nicolas@192.168.1.47 "sudo mkdir -p /opt/stroommoment && sudo chown nicolas:nicolas /opt/stroommoment && git clone /tmp/stroommoment.bundle /opt/stroommoment"
```

If `/opt/stroommoment` already exists and has no usable remote:

```bash
cd /opt/stroommoment
```

## Environment Variables

Copy the Compose example if overrides are needed:

```bash
cd /opt/stroommoment/apps/stroommoment
cp .env.example .env
```

Current public PoC defaults:

```env
NEXT_PUBLIC_API_BASE_URL=
STROOMMOMENT_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://poc.coolsnet.com
STROOMMOMENT_CACHE_HOST_PATH=/var/lib/stroommoment/cache
STROOMMOMENT_HTTP_PORT=8080
NEXT_PUBLIC_FEEDBACK_URL=
```

Notes:

- `NEXT_PUBLIC_API_BASE_URL` should stay blank for public Docker deployment so browser calls use same-origin `/api` routes.
- Direct local frontend development can use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
- `NEXT_PUBLIC_FEEDBACK_URL` can point to a Tally form, Google Form, GitHub issue link, or `mailto:` link. Leave it blank to show placeholder text.
- No API tokens or secrets are required for the current public data sources.
- Do not commit real `.env` files.

## Docker Compose Commands

Initial deploy:

```bash
sudo install -d -o nicolas -g nicolas -m 0755 /var/lib/stroommoment/cache
cd /opt/stroommoment
docker compose -f apps/stroommoment/docker-compose.yml ps
```

Follow logs:

```bash
```

Health checks:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/signals?hours=1 | head
```

## Manual Deploy Workflow

Local development:

```powershell
cd C:\Projects\StroomMoment
```

On the app host:

```bash
cd /opt/stroommoment
git pull --ff-only
docker compose -f apps/stroommoment/docker-compose.yml up -d --build
```

If GitHub is unavailable, use the emergency bundle/copy fallback above.

## Rollback Procedure

Rollback by Git commit:

```bash
cd /opt/stroommoment
```

Rollback the public route to the old static PoC, if the old web-01 content is intentionally retained:

```bash
ssh nicolas@192.168.1.23 "sudo EDGE_TLS_MODE=public EDGE_ENABLE_CROWDSEC=1 EDGE_ENABLE_RATE_LIMIT=1 EDGE_ENABLE_AUTH=1 EDGE_ENABLE_MEDIA=1 EDGE_ENABLE_PLEX=1 EDGE_ENABLE_SEERR=1 EDGE_ENABLE_TIME=1 EDGE_ENABLE_FAST=1 EDGE_ENABLE_POC=1 EDGE_ENABLE_COOLSADVISORY=1 EDGE_WWW_TARGET=192.168.1.24:80 EDGE_TIME_TARGET=192.168.1.24:80 EDGE_FAST_TARGET=192.168.1.24:80 EDGE_POC_TARGET=192.168.1.24:80 EDGE_COOLSADVISORY_TARGET=192.168.1.24:80 bash /tmp/install_public_edge_caddy.sh"
```

If the old static PoC is retired, rollback should instead select a previous StroomMoment commit or disable `EDGE_ENABLE_POC` until fixed.

## Cache Persistence

The backend stores external API response cache files under `/app/.cache` in the container.

Compose maps that path to:

```text
/var/lib/stroommoment/cache
```

This cache is safe to delete if corrupted. The app will refetch public source data. Deleting it increases upstream API calls briefly.

## Public Reverse Proxy

`edge-01` should be rebuilt with `poc.coolsnet.com` enabled and target set to the LXC router:

```bash
sudo EDGE_TLS_MODE=public \
  EDGE_ENABLE_CROWDSEC=1 \
  EDGE_ENABLE_RATE_LIMIT=1 \
  EDGE_ENABLE_AUTH=1 \
  EDGE_ENABLE_MEDIA=1 \
  EDGE_ENABLE_PLEX=1 \
  EDGE_ENABLE_SEERR=1 \
  EDGE_ENABLE_TIME=1 \
  EDGE_ENABLE_FAST=1 \
  EDGE_ENABLE_POC=1 \
  EDGE_ENABLE_COOLSADVISORY=1 \
  EDGE_WWW_TARGET=192.168.1.24:80 \
  EDGE_TIME_TARGET=192.168.1.24:80 \
  EDGE_FAST_TARGET=192.168.1.24:80 \
  EDGE_POC_TARGET=192.168.1.47:8080 \
  EDGE_COOLSADVISORY_TARGET=192.168.1.24:80 \
  bash /tmp/install_public_edge_caddy.sh
```

Preserve the current Cools Advisory alias list if rebuilding the edge config from a live shell.

## DNS Assumptions

- Private split DNS: `poc.coolsnet.com -> 192.168.1.23` through AdGuard on `management-01`.
- Public DNS: `poc.coolsnet.com` points to the public WAN/edge path.
- Router forwards public `80` and `443` to `edge-01`.

## HTTPS/TLS Assumptions

TLS terminates on `edge-01` using public Let's Encrypt certificates managed by Caddy.

The app container and LXC only serve plain HTTP on the private LAN path.

## Logs And Troubleshooting

On `stroommoment-01`:

```bash
cd /opt/stroommoment
curl -v http://127.0.0.1:8080/health
```

On `edge-01`:

```bash
sudo journalctl -u caddy -n 100 --no-pager
sudo tail -f /var/log/caddy/poc.access.log
curl -I http://192.168.1.47:8080/health
```

Common symptoms:

- `502` at public URL: check Docker services and edge target reachability.
- frontend loads but data fails: check `/api/signals` through the public hostname and backend logs.
- stale data warning: upstream source may be temporarily unavailable or cache may have expired.
- CORS errors in local dev: ensure `STROOMMOMENT_CORS_ORIGINS` includes the frontend origin.

## Backup Considerations

For the public PoC, back up source through Git and preserve the deployment notes.

The file cache is useful but not critical. It can be excluded from backups unless historical cache inspection becomes important.

If a database is added later, database backup and restore tests become mandatory before relying on it.

## Future Storage Discussion

The public PoC intentionally keeps storage simple. Options remain open:

| Option | Use Case | Tradeoff |
| --- | --- | --- |
| Persistent file cache | Current PoC cache for public API responses | simplest, easy to delete, poor querying |
| SQLite | local cache inspection, lightweight snapshots, single-host history | simple but not ideal for concurrent/multi-host writes |
| PostgreSQL | durable app data, future user accounts, shared state | more operations and backups |
| TimescaleDB | large time-series history with SQL analytics | useful only if history/retention becomes a core feature |
| InfluxDB | metrics/time-series style storage and dashboards | good for measurements, less natural for relational app data |

No database is added now because the PoC is stateless from the user perspective and only needs persistent backend cache.

## Future User Accounts

User accounts are explicitly deferred. They may become useful later for saved preferences, locations, tariffs, or Home Assistant/P1 integrations.

The current public PoC does not authenticate users and should not store personal user data.

## Future CI/CD Path

Possible later flow:

- create a GitHub or Gitea remote
- use GitHub Actions or a Gitea runner
- build versioned Docker images
- deploy by webhook or runner to `stroommoment-01`
- rollback by image tag or Git commit

Do not add CI/CD until manual deployment is boring and the app has enough users to justify it.

## Known Limitations

- No user accounts or saved preferences.
- No personal tariff, P1, Home Assistant, or MQTT integration.
- Price is a day-ahead wholesale BE signal, not an exact household tariff.
- File cache is not a historical database.
- No dedicated monitoring stack yet.
- Public rate limiting is handled at `edge-01`, not inside the app.
